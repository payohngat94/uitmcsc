
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
          src="https://res.cloudinary.com/dzu92rfh8/image/upload/v1758269802/CSC_Photocollage_2_vej81z.png"
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
