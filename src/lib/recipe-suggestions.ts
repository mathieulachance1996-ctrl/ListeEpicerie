import { prisma } from "@/lib/db";
import { hashItemNames } from "@/lib/ingredient-matching";
import {
  isQuebecRecipeSearchConfigured,
  searchQuebecRecipes,
} from "@/lib/quebec-recipes";
import {
  MIN_ITEMS_FOR_SUGGESTIONS,
  type RecipeSuggestion,
  type RecipeSuggestionsResponse,
} from "@/lib/recipe-types";

const CACHE_VERSION = "quebec-v1";

async function readCache(listId: string, itemsHash: string) {
  try {
    const cached = await prisma.recipeSuggestionCache.findUnique({
      where: { listId },
    });

    if (cached && cached.itemsHash === `${CACHE_VERSION}:${itemsHash}`) {
      return cached.results as RecipeSuggestion[];
    }
  } catch (error) {
    console.warn("Cache lecture impossible:", error);
  }

  return null;
}

async function writeCache(
  listId: string,
  itemsHash: string,
  recipes: RecipeSuggestion[]
) {
  if (recipes.length === 0) return;

  try {
    await prisma.recipeSuggestionCache.upsert({
      where: { listId },
      create: {
        listId,
        itemsHash: `${CACHE_VERSION}:${itemsHash}`,
        results: recipes,
      },
      update: {
        itemsHash: `${CACHE_VERSION}:${itemsHash}`,
        results: recipes,
      },
    });
  } catch (error) {
    console.warn("Cache ecriture impossible:", error);
  }
}

export async function getRecipeSuggestionsForList(
  listId: string,
  itemNames: string[]
): Promise<RecipeSuggestionsResponse> {
  const validItems = itemNames.map((n) => n.trim()).filter(Boolean);

  if (validItems.length < MIN_ITEMS_FOR_SUGGESTIONS) {
    return {
      recipes: [],
      cached: false,
      message:
        "Ajoute au moins 3 articles a ta liste pour voir des suggestions de repas.",
    };
  }

  if (!isQuebecRecipeSearchConfigured()) {
    return {
      recipes: [],
      cached: false,
      message: "Recherche de recettes quebecoises indisponible.",
    };
  }

  const itemsHash = hashItemNames(validItems);
  const cachedRecipes = await readCache(listId, itemsHash);

  if (cachedRecipes) {
    return {
      recipes: cachedRecipes,
      cached: true,
      message:
        cachedRecipes.length === 0
          ? "Aucune recette quebecoise correspondante. Essayez: poulet, tomate, riz, oignon."
          : undefined,
    };
  }

  const { recipes, message } = await searchQuebecRecipes(validItems);

  if (recipes.length > 0) {
    await writeCache(listId, itemsHash, recipes);
    return { recipes, cached: false };
  }

  return { recipes: [], cached: false, message };
}
