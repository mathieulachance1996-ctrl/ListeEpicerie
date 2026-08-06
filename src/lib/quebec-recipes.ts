import {
  countIngredientMatches,
  normalizeIngredient,
} from "@/lib/ingredient-matching";
import {
  MIN_INGREDIENT_MATCHES,
  type RecipeSuggestion,
} from "@/lib/recipe-types";
import type { QuebecRecipeCandidate } from "@/lib/quebec-recipe-types";

type RicardoSearchRow = {
  id: number;
  title: string;
  thumbnail?: string;
  image?: string;
  url: string;
  type: string;
  memo?: string;
};

type RicardoSearchResponse = {
  status: string;
  content?: {
    results?: {
      rows?: RicardoSearchRow[];
      totalPages?: number;
    };
  };
};

function isRecipeRow(row: RicardoSearchRow): boolean {
  return (
    row.type === "recipe" ||
    row.url.startsWith("recettes/") ||
    row.url.includes("/recettes/")
  );
}

function buildRicardoUrl(path: string): string {
  const clean = path.replace(/^\//, "");
  return `https://www.ricardocuisine.com/${clean}`;
}

function extractJsonLdRecipes(html: string): Array<{ ingredients: string[] }> {
  const recipes: Array<{ ingredients: string[] }> = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;

        if (obj["@type"] === "Recipe" || obj["@type"] === "https://schema.org/Recipe") {
          const ingredients = obj.recipeIngredient;
          if (Array.isArray(ingredients)) {
            recipes.push({
              ingredients: ingredients.filter(
                (i): i is string => typeof i === "string"
              ),
            });
          }
        }

        if (Array.isArray(obj["@graph"])) {
          for (const item of obj["@graph"]) {
            if (
              item &&
              typeof item === "object" &&
              (item as Record<string, unknown>)["@type"] === "Recipe"
            ) {
              const ingredients = (item as Record<string, unknown>)
                .recipeIngredient;
              if (Array.isArray(ingredients)) {
                recipes.push({
                  ingredients: ingredients.filter(
                    (i): i is string => typeof i === "string"
                  ),
                });
              }
            }
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  return recipes;
}

async function fetchRicardoIngredients(
  recipeUrl: string
): Promise<string[]> {
  try {
    const response = await fetch(recipeUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "EpicerieList/1.0 (recipe suggestions)",
        "Accept-Language": "fr-CA,fr;q=0.9",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const jsonLdRecipes = extractJsonLdRecipes(html);
    return jsonLdRecipes.flatMap((r) => r.ingredients);
  } catch {
    return [];
  }
}

async function searchRicardoCandidates(
  itemNames: string[]
): Promise<QuebecRecipeCandidate[]> {
  const terms = itemNames
    .slice(0, 6)
    .map((n) => normalizeIngredient(n))
    .filter(Boolean);

  const queries = [
    terms.slice(0, 4).join(" "),
    ...terms.slice(0, 3).map((t) => `recette ${t}`),
  ].filter(Boolean);

  const candidates: QuebecRecipeCandidate[] = [];
  const seen = new Set<number>();

  for (const query of queries.slice(0, 3)) {
    for (let page = 1; page <= 4; page++) {
      const params = new URLSearchParams({ q: query, page: String(page) });
      const response = await fetch(
        `https://www.ricardocuisine.com/api/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "EpicerieList/1.0 (recipe suggestions)",
          },
          next: { revalidate: 3600 },
        }
      );

      if (!response.ok) break;

      const data = (await response.json()) as RicardoSearchResponse;
      const rows = data.content?.results?.rows ?? [];
      if (rows.length === 0) break;

      for (const row of rows) {
        if (!isRecipeRow(row) || seen.has(row.id)) continue;
        seen.add(row.id);

        candidates.push({
          id: `ricardo-${row.id}`,
          title: row.title,
          image: row.thumbnail ?? row.image ?? null,
          url: buildRicardoUrl(row.url),
          source: "ricardocuisine",
          sourceLabel: "Ricardo Cuisine",
          description: row.memo,
        });
      }

      if (candidates.length >= 24) break;
      const totalPages = data.content?.results?.totalPages ?? 1;
      if (page >= totalPages) break;
    }

    if (candidates.length >= 24) break;
  }

  return candidates;
}

export async function searchQuebecRecipes(
  itemNames: string[]
): Promise<{ recipes: RecipeSuggestion[]; message?: string }> {
  const candidates = await searchRicardoCandidates(itemNames);

  if (candidates.length === 0) {
    return {
      recipes: [],
      message:
        "Aucune recette trouvee sur Ricardo Cuisine. Essayez des ingredients courants: poulet, tomate, riz, oignon.",
    };
  }

  const suggestions: RecipeSuggestion[] = [];

  const detailResults = await Promise.all(
    candidates.slice(0, 10).map(async (candidate) => {
      const ingredients = await fetchRicardoIngredients(candidate.url);
      return { candidate, ingredients };
    })
  );

  for (const { candidate, ingredients } of detailResults) {
    const titleWords = candidate.title.split(/\s+/);
    const pool =
      ingredients.length > 0
        ? ingredients
        : [candidate.title, candidate.description ?? "", ...titleWords];

    const { count, matchedItems } = countIngredientMatches(itemNames, pool);

    if (count >= MIN_INGREDIENT_MATCHES) {
      suggestions.push({
        id: candidate.id,
        title: candidate.title,
        image: candidate.image,
        url: candidate.url,
        source: candidate.sourceLabel,
        matchCount: count,
        matchedItems,
      });
    }
  }

  if (suggestions.length === 0) {
    return {
      recipes: [],
      message:
        "Des recettes quebecoises ont ete trouvees, mais aucune ne partage 3 ingredients avec votre liste. Ajoutez des articles plus generiques.",
    };
  }

  return {
    recipes: suggestions
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 8),
  };
}

export function isQuebecRecipeSearchConfigured(): boolean {
  return true;
}
