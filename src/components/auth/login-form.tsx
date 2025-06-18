
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/contexts/auth-context"; // Import useAuth

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth(); // Get login function from context
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
    try {
      await login(values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back to UiTM CSC!",
      });
      router.push("/dashboard"); // Redirect to dashboard on successful login
    } catch (error) {
      // Error toast is handled within the login function in AuthContext
      // but we can still set form errors if needed for specific fields
      form.setError("email", { type: "manual", message: " " }); // Clear previous for general error
      form.setError("password", { type: "manual", message: "Invalid credentials or login failed." });
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
              <Skeleton className="h-4 w-1/4" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
            <Skeleton className="h-10 w-full py-3" /> {/* Button */}
            <Skeleton className="h-4 w-3/4 mx-auto" /> {/* Forgot password link */}
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
                  disabled={form.formState.isSubmitting || !isClient}
                >
                  {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {/* Add link to Firebase password reset if needed */}
              Forgot your password? <a href="#" className="font-medium text-primary hover:underline">Reset here</a>
            </p>
            {/* Add link to Sign Up page if you implement signup */}
            {/* 
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign Up</Link>
            </p>
            */}
          </>
        )}
      </CardContent>
    </Card>
  );
}
