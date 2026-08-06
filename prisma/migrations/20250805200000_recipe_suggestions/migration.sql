-- CreateTable
CREATE TABLE "RecipeSuggestionCache" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "itemsHash" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeSuggestionCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeSuggestionCache_listId_key" ON "RecipeSuggestionCache"("listId");

-- AddForeignKey
ALTER TABLE "RecipeSuggestionCache" ADD CONSTRAINT "RecipeSuggestionCache_listId_fkey" FOREIGN KEY ("listId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
