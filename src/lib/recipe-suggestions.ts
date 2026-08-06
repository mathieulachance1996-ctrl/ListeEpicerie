import { prisma } from "@/lib/db";
import { isEdamamConfigured, searchFrenchRecipes } from "@/lib/edamam";
import { hashItemNames } from "@/lib/ingredient-matching";
import {
  MIN_ITEMS_FOR_SUGGESTIONS,
  type RecipeSuggestion,
  type RecipeSuggestionsResponse,
} from "@/lib/recipe-types";

async function readCache(listId: string, itemsHash: string) {
  try {
    const cached = await prisma.recipeSuggestionCache.findUnique({
      where: { listId },
    });

    if (cached && cached.itemsHash === itemsHash) {
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
  try {
    await prisma.recipeSuggestionCache.upsert({
      where: { listId },
      create: { listId, itemsHash, results: recipes },
      update: { itemsHash, results: recipes },
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

  if (!isEdamamConfigured()) {
    return {
      recipes: [],
      cached: false,
      message:
        "Configuration Edamam manquante. Ajoutez EDAMAM_APP_ID et EDAMAM_APP_KEY dans les variables d'environnement Vercel, puis redeployez.",
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
          ? "Aucune recette trouvee avec 3 ingredients en commun. Essayez d'ajouter des articles plus generiques (poulet, tomate, riz...)."
          : undefined,
    };
  }

  const { recipes, error } = await searchFrenchRecipes(validItems);

  if (error) {
    return { recipes: [], cached: false, message: error };
  }

  await writeCache(listId, itemsHash, recipes);

  if (recipes.length === 0) {
    return {
      recipes: [],
      cached: false,
      message:
        "Aucune recette trouvee avec 3 ingredients en commun. Essayez d'ajouter des articles plus generiques (poulet, tomate, riz, oignon, fromage...).",
    };
  }

  return { recipes, cached: false };
}
