import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  const original = await prisma.groceryList.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!original) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  const duplicate = await prisma.groceryList.create({
    data: {
      title: `${original.title} (copie)`,
      userId: session.user.id,
      items: {
        create: original.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          checked: false,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
