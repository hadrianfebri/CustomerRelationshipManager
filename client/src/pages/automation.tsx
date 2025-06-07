import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Users, Zap, Target, Mail, MessageSquare, Phone, Clock, CheckCircle } from "lucide-react";
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
    mutationFn: () => apiRequest("POST", "/api/automation/bulk-score-leads"),
    onSuccess: (data: AutomationMetrics) => {
      toast({
        title: "Bulk Lead Scoring Complete",
        description: `Processed ${data.processed} contacts, triggered ${data.automationTriggered} automations`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const lifecycleRulesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/automation/lifecycle-rules"),
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

  const sequences: CampaignSequence[] = campaigns || [];
  const churnAnalysis: ChurnAnalysis = churnData?.churnAnalysis || {
    totalContacts: 0,
    atRiskContacts: 0,
    churnRiskPercentage: "0",
    churnRisks: [],
    winBackOpportunities: []
  };
  const npsMetrics: NPSData = npsData || {
    npsScore: 0,
    totalResponses: 0,
    breakdown: {
      promoters: { count: 0, percentage: "0" },
      passives: { count: 0, percentage: "0" },
      detractors: { count: 0, percentage: "0" }
    },
    insights: []
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Automation Hub</h1>
          <p className="text-muted-foreground">
            Advanced lead scoring, lifecycle management, and campaign automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => bulkScoringMutation.mutate()}
            disabled={bulkScoringMutation.isPending}
            variant="outline"
          >
            {bulkScoringMutation.isPending ? "Processing..." : "Bulk Score Leads"}
          </Button>
          <Button
            onClick={() => lifecycleRulesMutation.mutate()}
            disabled={lifecycleRulesMutation.isPending}
          >
            {lifecycleRulesMutation.isPending ? "Applying..." : "Apply Lifecycle Rules"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnAnalysis.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Active in automation system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {churnAnalysis.churnRiskPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {churnAnalysis.atRiskContacts} contacts at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {npsMetrics.npsScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {npsMetrics.totalResponses} responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {sequences.length} total sequences
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Sequences</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="nps">Customer Satisfaction</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Management</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences.map((sequence) => (
              <Card key={sequence.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <Badge variant={sequence.status === 'active' ? 'default' : 'secondary'}>
                      {sequence.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {sequence.steps.length} steps across {sequence.channels.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4" />
                      <span>Channels:</span>
                      <div className="flex gap-1">
                        {sequence.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                            {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                            {channel === 'whatsapp' && <MessageSquare className="h-3 w-3 mr-1" />}
                            {channel === 'push' && <Zap className="h-3 w-3 mr-1" />}
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Sequence Steps:</div>
                      {sequence.steps.slice(0, 3).map((step) => (
                        <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Step {step.sequence}: {step.channel} 
                          {step.delay > 0 && `(+${step.delay > 1440 ? Math.round(step.delay / 1440) + 'd' : Math.round(step.delay / 60) + 'h'})`}
                        </div>
                      ))}
                      {sequence.steps.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{sequence.steps.length - 3} more steps
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="sm"
                      disabled={sequence.status !== 'active'}
                    >
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="churn">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Analysis</CardTitle>
                <CardDescription>
                  Identify at-risk customers and win-back opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{churnAnalysis.atRiskContacts}</div>
                    <div className="text-sm text-muted-foreground">At-Risk Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{churnAnalysis.churnRiskPercentage}%</div>
                    <div className="text-sm text-muted-foreground">Churn Risk Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{churnAnalysis.winBackOpportunities.length}</div>
                    <div className="text-sm text-muted-foreground">Win-Back Opportunities</div>
                  </div>
                </div>

                {churnAnalysis.churnRisks.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">High-Risk Contacts</h4>
                    {churnAnalysis.churnRisks.slice(0, 5).map((risk) => (
                      <div key={risk.contactId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{risk.name}</div>
                          <div className="text-sm text-muted-foreground">{risk.company}</div>
                          <div className="text-xs text-muted-foreground">
                            {risk.daysSinceLastActivity} days since last activity
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={risk.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            {risk.churnScore}% risk
                          </Badge>
                          <Button size="sm" variant="outline">
                            Launch Win-Back
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nps">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Net Promoter Score Dashboard</CardTitle>
                <CardDescription>
                  Track customer satisfaction and identify improvement opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{npsMetrics.npsScore}</div>
                    <div className="text-sm text-muted-foreground">NPS Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{npsMetrics.breakdown.promoters.count}</div>
                    <div className="text-sm text-muted-foreground">Promoters ({npsMetrics.breakdown.promoters.percentage}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{npsMetrics.breakdown.passives.count}</div>
                    <div className="text-sm text-muted-foreground">Passives ({npsMetrics.breakdown.passives.percentage}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{npsMetrics.breakdown.detractors.count}</div>
                    <div className="text-sm text-muted-foreground">Detractors ({npsMetrics.breakdown.detractors.percentage}%)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Promoters (9-10)</span>
                      <span>{npsMetrics.breakdown.promoters.percentage}%</span>
                    </div>
                    <Progress value={parseFloat(npsMetrics.breakdown.promoters.percentage)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Passives (7-8)</span>
                      <span>{npsMetrics.breakdown.passives.percentage}%</span>
                    </div>
                    <Progress value={parseFloat(npsMetrics.breakdown.passives.percentage)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Detractors (0-6)</span>
                      <span>{npsMetrics.breakdown.detractors.percentage}%</span>
                    </div>
                    <Progress value={parseFloat(npsMetrics.breakdown.detractors.percentage)} className="h-2" />
                  </div>
                </div>

                {npsMetrics.insights.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold">AI Insights</h4>
                    {npsMetrics.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Automation Rules</CardTitle>
                <CardDescription>
                  Automated lead qualification and progression based on AI scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Hot Leads (80-100)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-red-600">0</div>
                          <div className="text-xs text-muted-foreground">
                            Auto-assigned to senior sales rep
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            2-hour response SLA
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Qualified (55-79)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-orange-600">0</div>
                          <div className="text-xs text-muted-foreground">
                            SQL conversion opportunity
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            24-hour follow-up
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">MQL (40-54)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-xs text-muted-foreground">
                            Marketing qualified leads
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Nurture sequence
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Automation Rules</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Hot Lead Alert</div>
                          <div className="text-xs text-muted-foreground">
                            Score ≥ 80: Immediate notification + task assignment
                          </div>
                        </div>
                        <Badge variant="destructive">Active</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">SQL Conversion</div>
                          <div className="text-xs text-muted-foreground">
                            Score ≥ 55: Qualification workflow trigger
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">MQL Nurture</div>
                          <div className="text-xs text-muted-foreground">
                            Score ≥ 40: Automated nurture sequence
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}