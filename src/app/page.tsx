
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
          src="https://lh3.googleusercontent.com/pw/AP1GczO6xRk27Wcb1nKtPQNsVnD-0_p5LbLRUJa_8yt1RSDOM99yCU5Fk0QnZYCJJLYw9-67RH6tOYU0CcEom01ub7v2tC2-N_rIGWwWWKl9nSjEBGt_C3-_xNOCKXT46EygxJBYvTvMNvqW5BUlr2Oh2EyU=w1367-h911-s-no-gm?authuser=0"
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
