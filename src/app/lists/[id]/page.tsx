import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ListEditor } from "@/components/list-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const list = await prisma.groceryList.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { orderBy: { name: "asc" } } },
  });

  if (!list) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <ListEditor
          listId={list.id}
          initialTitle={list.title}
          initialItems={list.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            category: item.category ?? "",
            checked: item.checked,
          }))}
        />
      </main>
    </>
  );
}
