import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { CreateListButton } from "@/components/create-list-button";
import { ListCard } from "@/components/list-card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const lists = await prisma.groceryList.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground">
              Bonjour {session.user.email?.split("@")[0]} — gérez vos listes d&apos;épicerie
            </p>
          </div>
          <CreateListButton />
        </div>

        {lists.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              Vous n&apos;avez pas encore de liste d&apos;épicerie.
            </p>
            <CreateListButton />
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold">Listes récentes</h2>
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
          </>
        )}
      </main>
    </>
  );
}
