"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateListButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nouvelle liste" }),
      });

      if (res.ok) {
        const list = await res.json();
        router.push(`/lists/${list.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading} size="lg">
      <Plus className="h-5 w-5" />
      {loading ? "Création..." : "Créer une nouvelle liste"}
    </Button>
  );
}
