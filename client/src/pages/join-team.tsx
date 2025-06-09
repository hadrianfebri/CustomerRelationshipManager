import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const joinSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinTeam() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [invitation, setInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);

  const form = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Get token and email from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    if (!token || !email) {
      toast({
        title: "Invalid Invitation",
        description: "The invitation link is invalid or expired.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    // Validate invitation (you can add API call here if needed)
    setInvitation({ token, email });
    setIsValidating(false);
  }, [toast, setLocation]);

  const acceptInvitationMutation = useMutation({
    mutationFn: async (data: JoinFormData) => {
      if (!invitation) throw new Error("No invitation data");
      
      return await apiRequest("POST", "/api/team/accept-invitation", {
        token: invitation.token,
        email: invitation.email,
        ...data
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Welcome to the team!",
        description: "Your account has been created successfully.",
      });
      
      // Redirect to login page
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: JoinFormData) => {
    acceptInvitationMutation.mutate(data);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (acceptInvitationMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CRMWIZH!</h2>
              <p className="text-gray-600 mb-4">
                Your account has been created successfully. You'll be redirected to login shortly.
              </p>
              <Button onClick={() => setLocation('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Join CRMWIZH Team</CardTitle>
          <CardDescription>
            You've been invited to join the team. Complete your account setup below.
          </CardDescription>
          {invitation?.email && (
            <div className="text-sm text-gray-600 mt-2">
              Invitation for: <strong>{invitation.email}</strong>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a secure password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={acceptInvitationMutation.isPending}
              >
                {acceptInvitationMutation.isPending ? "Creating Account..." : "Join Team"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-gray-500">
            By joining, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}