import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingUp, Users, Zap, Target, Mail, MessageSquare, Phone, Clock, CheckCircle, Play, Pause, Plus, Brain, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutomationMetrics {
  processed: number;
  automationTriggered: number;
  mqlGenerated: number;
  sqlGenerated: number;
  hotLeadsGenerated: number;
}

interface ChurnAnalysis {
  totalContacts: number;
  atRiskContacts: number;
  churnRiskPercentage: string;
  churnRisks: Array<{
    contactId: number;
    name: string;
    company: string;
    churnScore: number;
    daysSinceLastActivity: number;
    riskLevel: 'high' | 'medium';
    recommendations: string[];
  }>;
  winBackOpportunities: Array<{
    contactId: number;
    name: string;
    company: string;
    reengagementScore: number;
    potentialValue: number;
  }>;
}

interface CampaignSequence {
  id: string;
  name: string;
  channels: string[];
  status: 'active' | 'paused' | 'draft';
  steps: Array<{
    id: string;
    sequence: number;
    channel: string;
    delay: number;
  }>;
}

interface NPSData {
  npsScore: number;
  totalResponses: number;
  breakdown: {
    promoters: { count: number; percentage: string };
    passives: { count: number; percentage: string };
    detractors: { count: number; percentage: string };
  };
  insights: string[];
}

export default function AutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns/sequences"],
  });

  const { data: churnData, isLoading: churnLoading } = useQuery({
    queryKey: ["/api/automation/churn-analysis"],
  });

  const { data: npsData, isLoading: npsLoading } = useQuery({
    queryKey: ["/api/automation/nps-dashboard"],
  });

  const bulkScoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/bulk-score-leads");
      return await response.json();
    },
    onSuccess: (data: AutomationMetrics) => {
      toast({
        title: "Bulk Lead Scoring Complete",
        description: `Processed ${data.processed} contacts, triggered ${data.automationTriggered} automations`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const lifecycleRulesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/lifecycle-rules");
      return await response.json();
    },
    onSuccess: (data: AutomationMetrics) => {
      toast({
        title: "Lifecycle Rules Applied",
        description: `Generated ${data.mqlGenerated} MQLs, ${data.sqlGenerated} SQLs, ${data.hotLeadsGenerated} hot leads`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const triggerCampaignMutation = useMutation({
    mutationFn: ({ sequenceId, contactId }: { sequenceId: string; contactId: number }) =>
      apiRequest("POST", `/api/campaigns/trigger/${sequenceId}`, { contactId }),
    onSuccess: (data) => {
      toast({
        title: "Campaign Triggered",
        description: data.message,
      });
    },
  });

  if (campaignsLoading || churnLoading || npsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const sequences: CampaignSequence[] = Array.isArray(campaigns) ? campaigns : [];
  const churnAnalysis: ChurnAnalysis = churnData?.churnAnalysis || {
    totalContacts: 0,
    atRiskContacts: 0,
    churnRiskPercentage: "0%",
    churnRisks: [],
    winBackOpportunities: []
  };
  const npsMetrics: NPSData = npsData || {
    npsScore: 0,
    totalResponses: 0,
    breakdown: {
      promoters: { count: 0, percentage: "0%" },
      passives: { count: 0, percentage: "0%" },
      detractors: { count: 0, percentage: "0%" }
    },
    insights: []
  };

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Marketing Automation" 
        subtitle="AI-powered workflows and campaign management"
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">AI Workflows</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Sequences</TabsTrigger>
            <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
            <TabsTrigger value="nps">NPS Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Lead Scoring
                  </CardTitle>
                  <CardDescription>
                    Automatically score all leads using AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => bulkScoringMutation.mutate()}
                    disabled={bulkScoringMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {bulkScoringMutation.isPending ? "Processing..." : "Run AI Scoring"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Lifecycle Rules
                  </CardTitle>
                  <CardDescription>
                    Apply MQL/SQL qualification rules automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => lifecycleRulesMutation.mutate()}
                    disabled={lifecycleRulesMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {lifecycleRulesMutation.isPending ? "Processing..." : "Apply Rules"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Smart Triggers
                  </CardTitle>
                  <CardDescription>
                    Automated actions based on contact behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Triggers</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Executed Today</span>
                      <Badge variant="outline">34</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Automation Performance</CardTitle>
                <CardDescription>Real-time metrics from your automation workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">47</div>
                    <div className="text-sm text-muted-foreground">Leads Qualified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">23</div>
                    <div className="text-sm text-muted-foreground">Campaigns Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">89%</div>
                    <div className="text-sm text-muted-foreground">Automation Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-muted-foreground">Actions Triggered</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Campaign Sequences</h3>
                <p className="text-sm text-muted-foreground">
                  Multi-channel automation sequences
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: "welcome",
                  name: "Welcome Series",
                  channels: ["email", "sms"],
                  status: "active",
                  steps: 5,
                  sent: 342,
                  opened: 287,
                  clicked: 156
                },
                {
                  id: "nurture",
                  name: "Lead Nurture",
                  channels: ["email", "whatsapp"],
                  status: "active",
                  steps: 7,
                  sent: 189,
                  opened: 134,
                  clicked: 67
                },
                {
                  id: "reengagement",
                  name: "Re-engagement",
                  channels: ["email", "push"],
                  status: "paused",
                  steps: 3,
                  sent: 78,
                  opened: 23,
                  clicked: 8
                }
              ].map((sequence) => (
                <Card key={sequence.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sequence.name}</CardTitle>
                      <Badge variant={sequence.status === "active" ? "default" : "secondary"}>
                        {sequence.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {sequence.steps} steps • {sequence.channels.join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{sequence.sent}</div>
                          <div className="text-muted-foreground">Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{sequence.opened}</div>
                          <div className="text-muted-foreground">Opened</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{sequence.clicked}</div>
                          <div className="text-muted-foreground">Clicked</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          {sequence.status === "active" ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                          {sequence.status === "active" ? "Pause" : "Start"}
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          <Send className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="churn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Churn Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{churnAnalysis.churnRiskPercentage}</div>
                  <div className="text-sm text-muted-foreground">
                    {churnAnalysis.atRiskContacts} of {churnAnalysis.totalContacts} contacts
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    At Risk Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{churnAnalysis.atRiskContacts}</div>
                  <div className="text-sm text-muted-foreground">High/Medium risk</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Win-Back Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{churnAnalysis.winBackOpportunities.length}</div>
                  <div className="text-sm text-muted-foreground">High-value prospects</div>
                </CardContent>
              </Card>
            </div>

            {churnAnalysis.churnRisks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>High-Risk Contacts</CardTitle>
                  <CardDescription>Contacts with high churn probability requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Days Since Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churnAnalysis.churnRisks.map((risk) => (
                        <TableRow key={risk.contactId}>
                          <TableCell>{risk.name}</TableCell>
                          <TableCell>{risk.company}</TableCell>
                          <TableCell>
                            <Badge variant={risk.riskLevel === "high" ? "destructive" : "default"}>
                              {risk.churnScore}/100
                            </Badge>
                          </TableCell>
                          <TableCell>{risk.daysSinceLastActivity} days</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nps" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>NPS Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-center">
                    <span className={npsMetrics.npsScore >= 50 ? "text-green-600" : 
                                   npsMetrics.npsScore >= 0 ? "text-yellow-600" : "text-red-600"}>
                      {npsMetrics.npsScore}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground text-center mt-2">
                    {npsMetrics.totalResponses} responses
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Promoters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{npsMetrics.breakdown.promoters.percentage}</div>
                  <div className="text-sm text-muted-foreground">{npsMetrics.breakdown.promoters.count} contacts</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Passives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{npsMetrics.breakdown.passives.percentage}</div>
                  <div className="text-sm text-muted-foreground">{npsMetrics.breakdown.passives.count} contacts</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{npsMetrics.breakdown.detractors.percentage}</div>
                  <div className="text-sm text-muted-foreground">{npsMetrics.breakdown.detractors.count} contacts</div>
                </CardContent>
              </Card>
            </div>

            {npsMetrics.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Automated analysis of NPS feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {npsMetrics.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}