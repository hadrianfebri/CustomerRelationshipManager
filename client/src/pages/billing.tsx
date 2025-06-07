import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp, 
  AlertCircle,
  Check,
  Crown,
  Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: currentPlan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/billing/current-plan"],
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/billing/usage"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/billing/invoices"],
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", `/api/billing/change-plan`, { planId });
    },
    onSuccess: () => {
      toast({
        title: "Plan Updated",
        description: "Your subscription has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/current-plan"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/billing/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will be cancelled at the end of the current period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/current-plan"] });
    },
  });

  const plans: Plan[] = [
    {
      id: "free",
      name: "Starter",
      price: 0,
      interval: "month",
      current: currentPlan?.planType === "free",
      features: [
        { name: "Up to 100 contacts", included: true },
        { name: "3 team members", included: true },
        { name: "Basic AI features", included: true },
        { name: "Email templates", included: true },
        { name: "Basic analytics", included: true },
        { name: "API access", included: false },
        { name: "Priority support", included: false },
      ],
    },
    {
      id: "pro",
      name: "Professional",
      price: 49,
      interval: "month",
      popular: true,
      current: currentPlan?.planType === "pro",
      features: [
        { name: "Up to 5,000 contacts", included: true },
        { name: "10 team members", included: true },
        { name: "Advanced AI automation", included: true },
        { name: "Custom email sequences", included: true },
        { name: "Advanced analytics", included: true },
        { name: "API access", included: true },
        { name: "Priority support", included: true },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      interval: "month",
      current: currentPlan?.planType === "enterprise",
      features: [
        { name: "Unlimited contacts", included: true },
        { name: "Unlimited team members", included: true },
        { name: "Custom AI workflows", included: true },
        { name: "White-label options", included: true },
        { name: "Custom integrations", included: true },
        { name: "Dedicated support", included: true },
        { name: "SLA guarantee", included: true },
      ],
    },
  ];

  const handleChangePlan = (planId: string) => {
    setSelectedPlan(planId);
    changePlanMutation.mutate(planId);
  };

  if (planLoading || usageLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan?.planType || "Free"}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                ${currentPlan?.amount || 0}/month
              </span>
              {currentPlan?.cancelAtPeriodEnd && (
                <Badge variant="destructive" className="text-xs">
                  Cancelling
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts Used</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.contacts || 0} / {currentPlan?.maxContacts || 100}
            </div>
            <Progress 
              value={(usage?.contacts || 0) / (currentPlan?.maxContacts || 100) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.teamMembers || 0} / {currentPlan?.maxUsers || 3}
            </div>
            <Progress 
              value={(usage?.teamMembers || 0) / (currentPlan?.maxUsers || 3) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage Alerts */}
      {((usage?.contacts || 0) / (currentPlan?.maxContacts || 100) > 0.8) && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Contact Limit Warning</h3>
                <p className="text-sm text-orange-700">
                  You're approaching your contact limit. Consider upgrading to avoid service interruption.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${plan.current ? 'bg-blue-50 border-blue-200' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Current Plan
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={feature.included ? '' : 'text-gray-500'}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button 
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={changePlanMutation.isPending}
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    {changePlanMutation.isPending && selectedPlan === plan.id ? 'Upgrading...' : 
                     plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
                {plan.current && plan.price > 0 && (
                  <Button 
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex justify-between items-center py-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : invoices?.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{invoice.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${invoice.amount}</div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No billing history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}