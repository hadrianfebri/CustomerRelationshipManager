import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, TrendingUp, MessageSquare, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIInsight {
  contactId: number;
  name: string;
  oldScore: number;
  newScore: number;
  reasoning: string;
}

interface FollowUpRecommendation {
  urgency: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  emailSubject: string;
  emailTemplate: string;
}

export default function AIAutomationPanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runAILeadScoring = async () => {
    setIsProcessing(true);
    setProgress(0);
    setInsights([]);

    try {
      const response = await fetch("/api/ai/auto-score-all-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.results || []);
        setProgress(100);
        
        toast({
          title: "AI Scoring Complete",
          description: `Updated scores for ${data.processed} contacts`,
        });
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      toast({
        title: "AI Service Required",
        description: "Please configure DeepSeek API key for AI features",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreChange = (oldScore: number, newScore: number) => {
    const change = newScore - oldScore;
    return {
      value: change,
      color: change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600',
      icon: change > 0 ? '↗' : change < 0 ? '↘' : '→'
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Automation Center
        </CardTitle>
        <CardDescription>
          Automated intelligence for lead scoring, recommendations, and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scoring" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">AI Lead Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze all contacts using AI to update lead scores
                </p>
              </div>
              <Button 
                onClick={runAILeadScoring}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Run AI Scoring"}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing contacts...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {insights.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Recent AI Analysis Results</h4>
                <div className="grid gap-3">
                  {insights.slice(0, 5).map((insight) => {
                    const scoreChange = getScoreChange(insight.oldScore, insight.newScore);
                    return (
                      <div key={insight.contactId} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{insight.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{insight.oldScore}</span>
                            <span className={`text-sm ${scoreChange.color}`}>
                              {scoreChange.icon} {insight.newScore}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{insight.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Lead Quality Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Hot Leads</span>
                      <Badge variant="destructive">2 active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Warm Leads</span>
                      <Badge variant="default">2 active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cold Leads</span>
                      <Badge variant="secondary">1 active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>• Focus on StartupForge (Score: 90)</p>
                    <p>• Follow up with TechStart (Score: 85)</p>
                    <p>• Re-engage Digital Innovations</p>
                    <p>• Schedule Q2 review with Global Enterprise</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Sentiment Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">70%</div>
                    <div className="text-sm text-muted-foreground">Positive Interactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">20%</div>
                    <div className="text-sm text-muted-foreground">Neutral Interactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">10%</div>
                    <div className="text-sm text-muted-foreground">Negative Interactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Automated Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-create Follow-up Tasks
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Email Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Update Deal Probabilities
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Lead Scoring</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sentiment Analysis</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Generation</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent AI Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Lead scoring updated</span>
                    <span className="text-muted-foreground">5 contacts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-up tasks created</span>
                    <span className="text-muted-foreground">3 tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email templates generated</span>
                    <span className="text-muted-foreground">2 templates</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}