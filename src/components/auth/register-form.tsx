
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
import { GraduationCap, Mail, Key, User } from "lucide-react"; // Added User icon
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

const registerFormSchema = z.object({
  studentOrStaffId: z.string().min(1, { message: "Student/Staff ID is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // path of error
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      studentOrStaffId: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await register(values.email, values.password, values.studentOrStaffId);
      toast({
        title: "Registration Successful",
        description: "Welcome to UiTM CSC! You are now logged in.",
      });
      router.push("/dashboard"); 
    } catch (error: any) {
      // The error toast is handled in the auth context, 
      // but we can set form errors if needed.
      if (error.code === 'auth/email-already-in-use') {
        form.setError("email", { type: "manual", message: "This email is already registered." });
      } else {
        form.setError("email", { type: "manual", message: " " });
        form.setError("confirmPassword", { type: "manual", message: "Registration failed. Please try again." });
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full text-primary">
          <GraduationCap size={48} strokeWidth={1.5} />
        </div>
        <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign up to access your clinical simulation resources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isClient ? (
          <div className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-10 w-full py-3" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentOrStaffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Student / Staff ID</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="e.g., 2023123456"
                            {...field}
                            className="pl-10"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
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
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="pl-10"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full text-base py-3" 
                  disabled={form.formState.isSubmitting || !isClient}
                >
                  {form.formState.isSubmitting ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
