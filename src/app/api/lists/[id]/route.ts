import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedList(id: string, userId: string) {
  return prisma.groceryList.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { name: "asc" } } },
  });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const list = await getOwnedList(id, session.user.id);

  if (!list) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  return NextResponse.json(list);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedList(id, session.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, items } = body;

    const list = await prisma.$transaction(async (tx) => {
      if (title !== undefined) {
        await tx.groceryList.update({
          where: { id },
          data: { title: title.trim() || existing.title },
        });
      }

      if (Array.isArray(items)) {
        await tx.groceryItem.deleteMany({ where: { listId: id } });

        if (items.length > 0) {
          await tx.groceryItem.createMany({
            data: items.map(
              (item: {
                name: string;
                quantity?: string;
                category?: string | null;
                checked?: boolean;
              }) => ({
                listId: id,
                name: item.name.trim(),
                quantity: item.quantity?.trim() || "1",
                category: item.category?.trim() || null,
                checked: item.checked ?? false,
              })
            ),
          });
        }
      }

      return tx.groceryList.findUnique({
        where: { id },
        include: { items: { orderBy: { name: "asc" } } },
      });
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("Update list error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedList(id, session.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  await prisma.groceryList.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
