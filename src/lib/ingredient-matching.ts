const FRENCH_PLURAL_SUFFIXES = ["aux", "eaux", "eux", "ies"];

export function normalizeIngredient(name: string): string {
  let normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  for (const suffix of FRENCH_PLURAL_SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
      normalized = normalized.slice(0, -suffix.length);
      break;
    }
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    normalized = normalized.slice(0, -1);
  }

  return normalized.trim();
}

function significantWords(text: string): string[] {
  const stopWords = new Set([
    "de",
    "du",
    "des",
    "le",
    "la",
    "les",
    "un",
    "une",
    "et",
    "ou",
    "en",
    "au",
    "aux",
    "avec",
    "sans",
    "pour",
    "the",
    "and",
    "or",
  ]);

  return normalizeIngredient(text)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

export function ingredientsMatch(listItem: string, recipeIngredient: string): boolean {
  const a = normalizeIngredient(listItem);
  const b = normalizeIngredient(recipeIngredient);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const wordsA = significantWords(listItem);
  const wordsB = significantWords(recipeIngredient);

  return wordsA.some((wa) =>
    wordsB.some((wb) => wa === wb || wa.includes(wb) || wb.includes(wa))
  );
}

export function countIngredientMatches(
  listItems: string[],
  recipeIngredients: string[]
): { count: number; matchedItems: string[] } {
  const matchedItems: string[] = [];

  for (const item of listItems) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const hasMatch = recipeIngredients.some((ingredient) =>
      ingredientsMatch(trimmed, ingredient)
    );

    if (hasMatch) {
      matchedItems.push(trimmed);
    }
  }

  return { count: matchedItems.length, matchedItems };
}

export function hashItemNames(names: string[]): string {
  const sorted = names
    .map((n) => normalizeIngredient(n))
    .filter(Boolean)
    .sort()
    .join("|");

  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = (hash << 5) - hash + sorted.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}
