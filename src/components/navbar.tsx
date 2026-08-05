import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, LayoutDashboard, History } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
          <ShoppingCart className="h-5 w-5" />
          <span>ÉpicerieList</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">
              <History className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Historique</span>
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
