export type RecipeSuggestion = {
  id: string;
  title: string;
  image: string | null;
  url: string;
  source: string;
  matchCount: number;
  matchedItems: string[];
};

export type RecipeSuggestionsResponse = {
  recipes: RecipeSuggestion[];
  cached: boolean;
  message?: string;
};

export const MIN_ITEMS_FOR_SUGGESTIONS = 3;
export const MIN_INGREDIENT_MATCHES = 3;
