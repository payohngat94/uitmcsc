
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GraduationCap, Mail, Key, User } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { Separator } from "../ui/separator";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, signInAsGuestAnonymously } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const result = await login(values.email, values.password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      let errorMessage = "Invalid credentials or login failed. Please try again.";
      if (result.error?.code === 'auth/invalid-credential' || result.error?.code === 'auth/user-not-found' || result.error?.code === 'auth/wrong-password') {
        errorMessage = "The email or password you entered is incorrect.";
        form.setError("password", { message: errorMessage });
      }
      form.setError("root.serverError", {
        type: "manual",
        message: errorMessage,
      });
    }
  }

  const handleGuestLogin = async () => {
    try {
      await signInAsGuestAnonymously();
      // The auth context will redirect to /dashboard on successful anonymous login.
    } catch (error) {
       form.setError("root.serverError", {
        type: "manual",
        message: "Guest login failed. Please try again later.",
      });
    }
  };


  return (
    <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 mb-4">
                <Image src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/943zc5n8r4hk/LogoUiTM.png" alt="UiTM CSC Logo" width={80} height={80} data-ai-hint="logo" />
                <h1 className="text-3xl font-bold font-headline">UiTM CSC</h1>
            </div>
            <p className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Smart Learning for Future Clinicians</p>
        </div>
        
        {!isClient ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full py-3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="m@example.com"
                            {...field}
                          />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                           <FormLabel>Password</FormLabel>
                           <Link href="#" className="text-sm text-primary hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root?.serverError && (
                  <FormMessage>{form.formState.errors.root.serverError.message}</FormMessage>
                )}
                
                <div className="space-y-3 pt-4">
                    <Button 
                      type="submit" 
                      className="w-full text-base py-3 h-12" 
                      disabled={form.formState.isSubmitting || !isClient}
                    >
                      {form.formState.isSubmitting ? "Logging in..." : "Login with Email"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full text-base py-3 h-12"
                      onClick={handleGuestLogin}
                      disabled={form.formState.isSubmitting}
                    >
                      <User className="mr-2 h-5 w-5" />
                      Sign in as Guest
                    </Button>
                     <Button 
                      type="button" 
                      variant="outline"
                      className="w-full text-base py-3 h-12" 
                      disabled
                    >
                      Login with Google
                    </Button>
                </div>

              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
               <span className="text-muted-foreground">Don't have an account? </span>
               <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
            </div>
          </>
        )}
    </div>
  );
}
