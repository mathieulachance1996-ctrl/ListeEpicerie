import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-accent/50 to-background p-4">
      <Suspense fallback={<div className="text-muted-foreground">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
