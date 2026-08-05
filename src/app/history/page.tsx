import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ListCard } from "@/components/list-card";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const lists = await prisma.groceryList.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Historique
          </h1>
          <p className="text-muted-foreground">
            Toutes vos listes passées — {lists.length} liste
            {lists.length !== 1 ? "s" : ""}
          </p>
        </div>

        {lists.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Aucune liste dans l&apos;historique.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={{
                  ...list,
                  createdAt: list.createdAt.toISOString(),
                  updatedAt: list.updatedAt.toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
