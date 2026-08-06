"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChefHat, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import {
  MIN_ITEMS_FOR_SUGGESTIONS,
  type RecipeSuggestion,
  type RecipeSuggestionsResponse,
} from "@/lib/recipe-types";

interface RecipeSuggestionsProps {
  listId: string;
  itemNames: string[];
}

export function RecipeSuggestions({ listId, itemNames }: RecipeSuggestionsProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string>("");

  const validItems = itemNames.map((n) => n.trim()).filter(Boolean);
  const itemsKey = validItems.sort().join("|").toLowerCase();

  const fetchSuggestions = useCallback(async () => {
    if (validItems.length < MIN_ITEMS_FOR_SUGGESTIONS) {
      setRecipes([]);
      setMessage(
        "Ajoute au moins 3 articles à ta liste pour voir des suggestions de repas."
      );
      setError(null);
      return;
    }

    if (itemsKey === lastFetchKey.current) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        items: JSON.stringify(validItems),
      });
      const res = await fetch(`/api/lists/${listId}/suggestions?${params}`);
      if (!res.ok) throw new Error("Impossible de charger les suggestions.");

      const data = (await res.json()) as RecipeSuggestionsResponse;
      lastFetchKey.current = itemsKey;
      setRecipes(data.recipes);
      setMessage(data.message ?? null);
      if (data.recipes.length === 0 && !data.message) {
        setMessage(
          "Aucune suggestion pour le moment. Verifiez vos cles Edamam sur Vercel."
        );
      }
    } catch {
      setError("Erreur lors de la recherche de recettes. Réessayez plus tard.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [listId, itemsKey, validItems]);

  useEffect(() => {
    if (validItems.length < MIN_ITEMS_FOR_SUGGESTIONS) {
      setRecipes([]);
      setMessage(
        "Ajoute au moins 3 articles à ta liste pour voir des suggestions de repas."
      );
      lastFetchKey.current = "";
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 1500);

    return () => clearTimeout(timer);
  }, [fetchSuggestions, validItems.length, itemsKey]);

  if (validItems.length < MIN_ITEMS_FOR_SUGGESTIONS) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChefHat className="h-5 w-5 text-primary" />
            Suggestions de repas
          </CardTitle>
          <CardDescription>
            Ajoute au moins 3 articles à ta liste pour voir des suggestions de repas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="h-5 w-5 text-primary" />
              Suggestions de repas basées sur ta liste
            </CardTitle>
            <CardDescription>
              Recettes francophones avec au moins 3 ingrédients en commun
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Replier" : "Déplier"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche de recettes en cours...
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && recipes.length === 0 && message && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          )}

          {!loading && recipes.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex flex-col overflow-hidden rounded-lg border bg-card"
                >
                  {recipe.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-muted">
                      <ChefHat className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h4 className="line-clamp-2 font-medium leading-snug">
                      {recipe.title}
                    </h4>
                    <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {recipe.matchCount} article
                      {recipe.matchCount > 1 ? "s" : ""} de ta liste utilisé
                      {recipe.matchCount > 1 ? "s" : ""}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Source : {recipe.source}
                    </p>
                    <Button variant="outline" size="sm" className="mt-auto" asChild>
                      <a href={recipe.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Voir la recette
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
