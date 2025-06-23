import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <RegisterForm />
    </main>
  );
}
