import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  Mail,
  Phone,
  Download,
  Filter
} from "lucide-react";

interface ReportData {
  salesMetrics: {
    totalRevenue: number;
    dealsWon: number;
    dealsLost: number;
    conversionRate: number;
    averageDealSize: number;
    salesCycle: number;
  };
  leadMetrics: {
    totalLeads: number;
    qualifiedLeads: number;
    hotLeads: number;
    leadSources: Array<{ source: string; count: number; percentage: number }>;
  };
  activityMetrics: {
    totalActivities: number;
    emailsSent: number;
    callsMade: number;
    meetingsScheduled: number;
  };
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    leads: number;
    deals: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
}

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports", dateRange, reportType],
  });

  const mockData: ReportData = {
    salesMetrics: {
      totalRevenue: 248500,
      dealsWon: 24,
      dealsLost: 8,
      conversionRate: 75,
      averageDealSize: 10354,
      salesCycle: 18
    },
    leadMetrics: {
      totalLeads: 156,
      qualifiedLeads: 89,
      hotLeads: 23,
      leadSources: [
        { source: "Website", count: 62, percentage: 39.7 },
        { source: "Email Campaign", count: 34, percentage: 21.8 },
        { source: "Referral", count: 28, percentage: 17.9 },
        { source: "Social Media", count: 20, percentage: 12.8 },
        { source: "Cold Outreach", count: 12, percentage: 7.7 }
      ]
    },
    activityMetrics: {
      totalActivities: 342,
      emailsSent: 189,
      callsMade: 97,
      meetingsScheduled: 56
    },
    timeSeriesData: [
      { date: "Week 1", revenue: 45000, leads: 32, deals: 5 },
      { date: "Week 2", revenue: 52000, leads: 28, deals: 7 },
      { date: "Week 3", revenue: 48000, leads: 35, deals: 6 },
      { date: "Week 4", revenue: 63000, leads: 41, deals: 8 },
      { date: "Week 5", revenue: 40500, leads: 20, deals: 4 }
    ],
    conversionFunnel: [
      { stage: "Leads Generated", count: 156, conversionRate: 100 },
      { stage: "Qualified Leads", count: 89, conversionRate: 57.1 },
      { stage: "Opportunities", count: 45, conversionRate: 28.8 },
      { stage: "Proposals Sent", count: 32, conversionRate: 20.5 },
      { stage: "Deals Won", count: 24, conversionRate: 15.4 }
    ]
  };

  const safeData = reportData || mockData;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your sales performance and business metrics</p>
        </div>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${safeData.salesMetrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeData.salesMetrics.dealsWon}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeData.salesMetrics.conversionRate}%</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${safeData.salesMetrics.averageDealSize.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5.7% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity Reports</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={safeData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deals" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">{data.salesMetrics.salesCycle} days</div>
                <p className="text-sm text-muted-foreground text-center mt-2">Average time to close</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center text-green-600">
                  {Math.round((data.salesMetrics.dealsWon / (data.salesMetrics.dealsWon + data.salesMetrics.dealsLost)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {data.salesMetrics.dealsWon} won, {data.salesMetrics.dealsLost} lost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pipeline Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">${(data.salesMetrics.averageDealSize * 15).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground text-center mt-2">Active opportunities</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.leadMetrics.leadSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.leadMetrics.leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Quality Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Leads</span>
                  <Badge variant="outline">{data.leadMetrics.totalLeads}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Qualified Leads</span>
                  <Badge className="bg-blue-100 text-blue-800">{data.leadMetrics.qualifiedLeads}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Hot Leads</span>
                  <Badge className="bg-red-100 text-red-800">{data.leadMetrics.hotLeads}</Badge>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Qualification Rate</div>
                  <div className="text-2xl font-bold">
                    {Math.round((data.leadMetrics.qualifiedLeads / data.leadMetrics.totalLeads) * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activityMetrics.totalActivities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activityMetrics.emailsSent}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activityMetrics.callsMade}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meetings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activityMetrics.meetingsScheduled}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{stage.count}</span>
                        <Badge variant="outline">{stage.conversionRate}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-blue-600 h-6 rounded-full transition-all duration-300"
                        style={{ width: `${stage.conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
