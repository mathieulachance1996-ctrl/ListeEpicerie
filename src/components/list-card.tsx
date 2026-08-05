"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDown, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type ListSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
  items?: { id: string }[];
};

interface ListCardProps {
  list: ListSummary;
  showDuplicate?: boolean;
}

export function ListCard({ list, showDuplicate = true }: ListCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const itemCount = list._count?.items ?? list.items?.length ?? 0;

  async function handleDuplicate() {
    setLoading("duplicate");
    try {
      const res = await fetch(`/api/lists/${list.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/lists/${data.id}`);
      }
    } finally {
      setLoading(null);
    }
  }

  function handleExportPdf() {
    window.open(`/api/lists/${list.id}/pdf`, "_blank");
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{list.title}</CardTitle>
        <CardDescription>
          {itemCount} article{itemCount !== 1 ? "s" : ""} · Modifiée le{" "}
          {formatDate(list.updatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-xs text-muted-foreground">
          Créée le {formatDate(list.createdAt)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={`/lists/${list.id}`}>
            <ExternalLink className="h-4 w-4" />
            Ouvrir
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4" />
          PDF
        </Button>
        {showDuplicate && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDuplicate}
            disabled={loading === "duplicate"}
          >
            <Copy className="h-4 w-4" />
            Dupliquer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
