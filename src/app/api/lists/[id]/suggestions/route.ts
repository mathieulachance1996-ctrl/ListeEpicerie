import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRecipeSuggestionsForList } from "@/lib/recipe-suggestions";

type RouteParams = { params: Promise<{ id: string }> };

export const maxDuration = 30;

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const previewItems = searchParams.get("items");

  const list = await prisma.groceryList.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!list) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  let itemNames = list.items.map((item) => item.name);

  if (previewItems) {
    try {
      const parsed = JSON.parse(previewItems) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        itemNames = parsed;
      }
    } catch {
      return NextResponse.json({ error: "Format items invalide." }, { status: 400 });
    }
  }

  const result = await getRecipeSuggestionsForList(list.id, itemNames);

  return NextResponse.json(result);
}
