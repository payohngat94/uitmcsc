
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Hourglass, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PendingApprovalPage() {
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      // Toast is handled in auth context
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-yellow-500/10 rounded-full text-yellow-600">
            <Hourglass size={48} strokeWidth={1.5} />
          </div>
          <CardTitle className="text-2xl font-headline">Account Pending Approval</CardTitle>
          <CardDescription>
            Thank you for registering! Your account is currently awaiting verification by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be able to access the dashboard and other features once your account has been approved. Please check back later. If you believe this is an error, please contact the CSC administrator.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
