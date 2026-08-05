import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateGroceryListPdf } from "@/lib/pdf-document";
import { slugify } from "@/lib/utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.groceryList.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!list) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  try {
    const buffer = await generateGroceryListPdf({
      title: list.title,
      createdAt: list.createdAt,
      items: list.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        checked: item.checked,
      })),
    });

    const filename = `${slugify(list.title)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF." },
      { status: 500 }
    );
  }
}
