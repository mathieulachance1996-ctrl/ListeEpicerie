import {
  countIngredientMatches,
  normalizeIngredient,
} from "@/lib/ingredient-matching";
import {
  MIN_INGREDIENT_MATCHES,
  type RecipeSuggestion,
} from "@/lib/recipe-types";

type EdamamIngredient = {
  text: string;
  food?: string;
};

type EdamamRecipe = {
  uri: string;
  label: string;
  image?: string;
  url: string;
  source: string;
  ingredients: EdamamIngredient[];
};

type EdamamSearchResponse = {
  hits?: Array<{ recipe: EdamamRecipe }>;
};

function getRecipeId(uri: string): string {
  return uri.split("#recipe_").pop() ?? uri;
}

function isFrenchSource(source: string, title: string): boolean {
  const frenchSources = [
    "marmiton",
    "ricardo",
    "750g",
    "cuisine",
    "recette",
    "journal des femmes",
    "ptitchef",
    "atlas",
    "francais",
    "français",
  ];

  const combined = `${source} ${title}`.toLowerCase();
  return frenchSources.some((keyword) => combined.includes(keyword));
}

export async function searchFrenchRecipes(
  itemNames: string[]
): Promise<RecipeSuggestion[]> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    console.warn("EDAMAM_APP_ID ou EDAMAM_APP_KEY manquant.");
    return [];
  }

  const searchTerms = itemNames
    .slice(0, 8)
    .map((name) => normalizeIngredient(name))
    .filter(Boolean);

  const params = new URLSearchParams({
    type: "public",
    app_id: appId,
    app_key: appKey,
    q: searchTerms.slice(0, 5).join(" "),
    to: "40",
    lang: "fr",
  });

  for (const term of searchTerms.slice(0, 6)) {
    params.append("ingr", term);
  }

  const response = await fetch(
    `https://api.edamam.com/api/recipes/v2?${params.toString()}`,
    {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    console.error("Edamam API error:", response.status, await response.text());
    return [];
  }

  const data = (await response.json()) as EdamamSearchResponse;
  const hits = data.hits ?? [];
  const suggestions: RecipeSuggestion[] = [];
  const seenIds = new Set<string>();

  for (const hit of hits) {
    const recipe = hit.recipe;
    const id = getRecipeId(recipe.uri);

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const ingredientTexts = recipe.ingredients.map(
      (ing) => ing.food ?? ing.text
    );

    const { count, matchedItems } = countIngredientMatches(
      itemNames,
      ingredientTexts
    );

    if (count < MIN_INGREDIENT_MATCHES) continue;

    suggestions.push({
      id,
      title: recipe.label,
      image: recipe.image ?? null,
      url: recipe.url,
      source: recipe.source,
      matchCount: count,
      matchedItems,
    });
  }

  return suggestions
    .sort((a, b) => {
      const aFrench = isFrenchSource(a.source, a.title) ? 1 : 0;
      const bFrench = isFrenchSource(b.source, b.title) ? 1 : 0;
      if (aFrench !== bFrench) return bFrench - aFrench;
      return b.matchCount - a.matchCount;
    })
    .slice(0, 8);
}
