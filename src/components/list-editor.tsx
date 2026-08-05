"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, FileDown, ArrowLeft } from "lucide-react";
import Link from "next/link";

export type GroceryItemData = {
  id?: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
};

interface ListEditorProps {
  listId: string;
  initialTitle: string;
  initialItems: GroceryItemData[];
}

const emptyItem = (): GroceryItemData => ({
  name: "",
  quantity: "1",
  category: "",
  checked: false,
});

export function ListEditor({
  listId,
  initialTitle,
  initialItems,
}: ListEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<GroceryItemData[]>(
    initialItems.length > 0 ? initialItems : [emptyItem()]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const save = useCallback(async () => {
    const validItems = items.filter((item) => item.name.trim());
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          items: validItems.map((item) => ({
            name: item.name,
            quantity: item.quantity || "1",
            category: item.category || null,
            checked: item.checked,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Échec de la sauvegarde");
      }

      setSaved(true);
      setTimeout(() => {
        if (isMountedRef.current) setSaved(false);
      }, 2000);
      router.refresh();
    } catch {
      setError("Impossible de sauvegarder. Réessayez.");
    } finally {
      setSaving(false);
    }
  }, [listId, title, items, router]);

  useEffect(() => {
    const hasChanges =
      title !== initialTitle ||
      JSON.stringify(items) !== JSON.stringify(initialItems);

    if (!hasChanges || !items.some((i) => i.name.trim())) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, items, initialTitle, initialItems, save]);

  function updateItem(index: number, field: keyof GroceryItemData, value: string | boolean) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleExportPdf() {
    window.open(`/api/lists/${listId}/pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4" />
            Exporter PDF
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titre de la liste</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Courses de la semaine"
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-3">
        <Label>Articles</Label>

        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.checked}
                onCheckedChange={(checked) =>
                  updateItem(index, "checked", checked === true)
                }
              />
            </div>
            <Input
              value={item.name}
              onChange={(e) => updateItem(index, "name", e.target.value)}
              placeholder="Nom de l'article"
              className="flex-1"
            />
            <Input
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
              placeholder="Qté"
              className="w-full sm:w-20"
            />
            <Input
              value={item.category}
              onChange={(e) => updateItem(index, "category", e.target.value)}
              placeholder="Catégorie"
              className="w-full sm:w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" onClick={addItem} className="w-full">
          <Plus className="h-4 w-4" />
          Ajouter un article
        </Button>
      </div>
    </div>
  );
}
