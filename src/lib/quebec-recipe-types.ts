export type QuebecRecipeSource = "ricardocuisine" | "mordu" | "cuisineaz";

export type QuebecRecipeCandidate = {
  id: string;
  title: string;
  image: string | null;
  url: string;
  source: QuebecRecipeSource;
  sourceLabel: string;
  description?: string;
};

export type QuebecRecipeSearchResult = {
  recipes: import("@/lib/recipe-types").RecipeSuggestion[];
  message?: string;
};

export const QUEBEC_RECIPE_SOURCES: Record<
  QuebecRecipeSource,
  { label: string; domain: string }
> = {
  ricardocuisine: {
    label: "Ricardo Cuisine",
    domain: "ricardocuisine.com",
  },
  mordu: {
    label: "Mordu (Radio-Canada)",
    domain: "ici.radio-canada.ca",
  },
  cuisineaz: {
    label: "Cuisine AZ",
    domain: "cuisineaz.com",
  },
};
