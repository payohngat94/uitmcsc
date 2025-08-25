
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-12">
        <LoginForm />
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/hd7b29ulivza/Loginpage.jpg"
          alt="Medical simulation training"
          fill
          className="object-cover"
          data-ai-hint="medical simulation"
          priority
        />
      </div>
    </main>
  );
}

