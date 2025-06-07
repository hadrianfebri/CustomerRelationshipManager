import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Mail, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AutomationPanel() {
  const [isRunning, setIsRunning] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runAutomation = useMutation({
    mutationFn: async (endpoint: string) => {
      setIsRunning(prev => ({ ...prev, [endpoint]: true }));
      const response = await apiRequest("POST", endpoint);
      return response.json();
    },
    onSuccess: (data, endpoint) => {
      setIsRunning(prev => ({ ...prev, [endpoint]: false }));
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Automation completed",
        description: data.message,
      });
    },
    onError: (error: any, endpoint) => {
      setIsRunning(prev => ({ ...prev, [endpoint]: false }));
      toast({
        title: "Automation failed",
        description: error.message || "Failed to run automation",
        variant: "destructive",
      });
    },
  });

  const automations = [
    {
      id: "lead-scoring",
      title: "Lead Scoring",
      description: "Automatically update lead scores based on contact data",
      endpoint: "/api/workflows/lead-scoring",
      icon: TrendingUp,
      color: "text-blue-600",
      estimatedTime: "30 seconds",
    },
    {
      id: "task-creation",
      title: "Auto Task Creation",
      description: "Create follow-up tasks for stale leads",
      endpoint: "/api/tasks/auto-create",
      icon: Clock,
      color: "text-orange-600",
      estimatedTime: "15 seconds",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Automation Center
        </CardTitle>
        <CardDescription>
          Run automated workflows to optimize your sales process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {automations.map((automation) => {
            const Icon = automation.icon;
            const running = isRunning[automation.endpoint];
            
            return (
              <div 
                key={automation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${automation.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-foreground">
                      {automation.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      {automation.description}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {automation.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => runAutomation.mutate(automation.endpoint)}
                  disabled={running}
                  className="flex items-center space-x-2"
                >
                  {running ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Run</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}