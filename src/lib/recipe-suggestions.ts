import { prisma } from "@/lib/db";
import { searchFrenchRecipes } from "@/lib/edamam";
import { hashItemNames } from "@/lib/ingredient-matching";
import {
  MIN_ITEMS_FOR_SUGGESTIONS,
  type RecipeSuggestion,
  type RecipeSuggestionsResponse,
} from "@/lib/recipe-types";

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
        "Ajoute au moins 3 articles à ta liste pour voir des suggestions de repas.",
    };
  }

  const itemsHash = hashItemNames(validItems);

  const cached = await prisma.recipeSuggestionCache.findUnique({
    where: { listId },
  });

  if (cached && cached.itemsHash === itemsHash) {
    return {
      recipes: cached.results as RecipeSuggestion[],
      cached: true,
    };
  }

  const recipes = await searchFrenchRecipes(validItems);

  await prisma.recipeSuggestionCache.upsert({
    where: { listId },
    create: {
      listId,
      itemsHash,
      results: recipes,
    },
    update: {
      itemsHash,
      results: recipes,
    },
  });

  if (recipes.length === 0) {
    return {
      recipes: [],
      cached: false,
      message:
        "Ajoute encore quelques articles pour voir des suggestions de repas.",
    };
  }

  return { recipes, cached: false };
}
