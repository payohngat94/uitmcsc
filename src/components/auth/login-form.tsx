
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, signInAsGuestAnonymously } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

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
    try {
      await login(values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back to UiTM CSC!",
      });
      router.push("/dashboard"); 
    } catch (error) {
      form.setError("email", { type: "manual", message: " " }); 
      form.setError("password", { type: "manual", message: "Invalid credentials or login failed." });
    }
  }

  async function handleGuestLogin() {
    setIsGuestSubmitting(true);
    try {
      await signInAsGuestAnonymously();
    } catch (error: any) {
      console.error("Guest login trigger failed in form:", error);
    } finally {
      setIsGuestSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full text-primary">
          <GraduationCap size={48} strokeWidth={1.5} />
        </div>
        <CardTitle className="text-3xl font-headline">UiTM CSC</CardTitle>
        <CardDescription className="text-muted-foreground">
          Access your clinical simulation resources.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Skeleton className="h-10 w-full py-3" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            className="pl-10"
                            aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                          />
                        </FormControl>
                      </div>
                      <FormMessage id="email-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="pl-10"
                              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                            />
                          </FormControl>
                        </div>
                      <FormMessage id="password-error" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full text-base py-3" 
                  disabled={form.formState.isSubmitting || !isClient || isGuestSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-medium text-primary hover:underline disabled:opacity-70"
                  onClick={handleGuestLogin}
                  disabled={isGuestSubmitting || form.formState.isSubmitting || !isClient}
              >
                  {isGuestSubmitting ? "Signing in as guest..." : "Sign in as a guest"}
              </Button>
              <span className="mx-1">|</span>
               <Link href="/register" className="font-medium text-primary hover:underline">
                  Don't have an account? Sign Up
                </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
