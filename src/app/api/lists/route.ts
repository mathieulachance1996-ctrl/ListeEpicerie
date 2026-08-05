import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const lists = await prisma.groceryList.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(lists);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = body.title?.trim() || "Nouvelle liste";

    const list = await prisma.groceryList.create({
      data: {
        title,
        userId: session.user.id,
      },
      include: { items: true },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("Create list error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la liste." },
      { status: 500 }
    );
  }
}
