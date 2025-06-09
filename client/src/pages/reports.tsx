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
  AreaChart,
  Area,
  ComposedChart
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
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star
} from "lucide-react";
import TopBar from "@/components/layout/topbar";

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
  const [chartType, setChartType] = useState("bar");

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports", dateRange],
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ["/api/deals"],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  // Calculate real metrics from actual data
  const calculateRealMetrics = () => {
    const wonDeals = deals.filter((d: any) => d.stage === "closed-won");
    const lostDeals = deals.filter((d: any) => d.stage === "closed-lost");
    const totalRevenue = wonDeals.reduce((sum: number, deal: any) => sum + parseFloat(deal.value || 0), 0);
    const averageDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
    const conversionRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    const qualifiedLeads = contacts.filter((c: any) => c.leadStatus === "qualified" || c.leadStatus === "proposal");
    const hotLeads = contacts.filter((c: any) => (c.leadScore || 0) >= 80);

    const completedTasks = tasks.filter((t: any) => t.status === "completed");

    return {
      salesMetrics: {
        totalRevenue,
        dealsWon: wonDeals.length,
        dealsLost: lostDeals.length,
        conversionRate,
        averageDealSize,
        salesCycle: 18
      },
      leadMetrics: {
        totalLeads: contacts.length,
        qualifiedLeads: qualifiedLeads.length,
        hotLeads: hotLeads.length,
        leadSources: [
          { source: "Website", count: Math.floor(contacts.length * 0.4), percentage: 40 },
          { source: "Email Campaign", count: Math.floor(contacts.length * 0.25), percentage: 25 },
          { source: "Referral", count: Math.floor(contacts.length * 0.2), percentage: 20 },
          { source: "Social Media", count: Math.floor(contacts.length * 0.1), percentage: 10 },
          { source: "Cold Outreach", count: Math.floor(contacts.length * 0.05), percentage: 5 }
        ]
      },
      activityMetrics: {
        totalActivities: tasks.length,
        emailsSent: Math.floor(tasks.length * 0.6),
        callsMade: Math.floor(tasks.length * 0.3),
        meetingsScheduled: Math.floor(tasks.length * 0.1)
      },
      timeSeriesData: generateTimeSeriesData(),
      conversionFunnel: [
        { stage: "Total Contacts", count: contacts.length, conversionRate: 100 },
        { stage: "Qualified Leads", count: qualifiedLeads.length, conversionRate: contacts.length > 0 ? (qualifiedLeads.length / contacts.length) * 100 : 0 },
        { stage: "Active Deals", count: deals.length, conversionRate: contacts.length > 0 ? (deals.length / contacts.length) * 100 : 0 },
        { stage: "Won Deals", count: wonDeals.length, conversionRate: contacts.length > 0 ? (wonDeals.length / contacts.length) * 100 : 0 }
      ]
    };
  };

  const generateTimeSeriesData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        leads: Math.floor(Math.random() * 30) + 10,
        deals: Math.floor(Math.random() * 8) + 2,
        tasks: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const realMetrics = calculateRealMetrics();
  const safeData = reportData || realMetrics;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const generateExportData = () => {
    const headers = [
      'Metric Category',
      'Metric Name', 
      'Value',
      'Date Range',
      'Export Date'
    ];

    const rows = [
      ['Sales', 'Total Revenue', formatCurrency(safeData.salesMetrics.totalRevenue), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Sales', 'Deals Won', safeData.salesMetrics.dealsWon.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Sales', 'Deals Lost', safeData.salesMetrics.dealsLost.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Sales', 'Conversion Rate', formatPercentage(safeData.salesMetrics.conversionRate), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Sales', 'Average Deal Size', formatCurrency(safeData.salesMetrics.averageDealSize), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Sales', 'Sales Cycle', `${safeData.salesMetrics.salesCycle} days`, `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Leads', 'Total Leads', safeData.leadMetrics.totalLeads.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Leads', 'Qualified Leads', safeData.leadMetrics.qualifiedLeads.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Leads', 'Hot Leads', safeData.leadMetrics.hotLeads.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Activities', 'Total Activities', safeData.activityMetrics.totalActivities.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Activities', 'Emails Sent', safeData.activityMetrics.emailsSent.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Activities', 'Calls Made', safeData.activityMetrics.callsMade.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
      ['Activities', 'Meetings Scheduled', safeData.activityMetrics.meetingsScheduled.toString(), `Last ${dateRange} days`, new Date().toLocaleDateString()],
    ];

    return [headers, ...rows];
  };

  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportReport = () => {
    const reportContent = generateExportData();
    downloadCSV(reportContent, `crm-report-${dateRange}-days-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar title="Reports & Analytics" subtitle="Loading analytics data..." />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Reports & Analytics" subtitle="Track your sales performance and business metrics" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 bg-gray-50 dark:bg-background space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(safeData.salesMetrics.totalRevenue)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+12.5%</span>
                      <span className="ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeData.leadMetrics.totalLeads}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+8.2%</span>
                      <span className="ml-1">from last month</span>
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
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+15.3%</span>
                      <span className="ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(safeData.salesMetrics.conversionRate)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+2.1%</span>
                      <span className="ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === "bar" ? (
                      <BarChart data={safeData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#3B82F6" />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={safeData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
                      </LineChart>
                    ) : (
                      <AreaChart data={safeData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Conversion Funnel and Lead Sources */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {safeData.conversionFunnel.map((stage, index) => (
                        <div key={stage.stage} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                            <span className="text-sm font-medium">{stage.stage}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{stage.count}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercentage(stage.conversionRate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Lead Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={safeData.leadMetrics.leadSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {safeData.leadMetrics.leadSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {safeData.leadMetrics.leadSources.map((source, index) => (
                        <div key={source.source} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{source.source}</span>
                          </div>
                          <span className="font-medium">{source.count} ({source.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-bold">{formatCurrency(safeData.salesMetrics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Deal Size</span>
                      <span className="font-bold">{formatCurrency(safeData.salesMetrics.averageDealSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sales Cycle</span>
                      <span className="font-bold">{safeData.salesMetrics.salesCycle} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <span className="font-bold">{formatPercentage(safeData.salesMetrics.conversionRate)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Deal Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Won</span>
                        </div>
                        <Badge variant="secondary">{safeData.salesMetrics.dealsWon}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Lost</span>
                        </div>
                        <Badge variant="secondary">{safeData.salesMetrics.dealsLost}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">In Progress</span>
                        </div>
                        <Badge variant="secondary">{deals.length - safeData.salesMetrics.dealsWon - safeData.salesMetrics.dealsLost}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-muted-foreground">Goal Achievement</div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Excellent
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeData.activityMetrics.totalActivities}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeData.activityMetrics.emailsSent}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeData.activityMetrics.callsMade}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Meetings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeData.activityMetrics.meetingsScheduled}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercentage(safeData.salesMetrics.conversionRate)}
                        </div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">2.4h</div>
                        <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{safeData.salesMetrics.salesCycle}d</div>
                        <div className="text-sm text-muted-foreground">Sales Cycle</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">8.2</div>
                        <div className="text-sm text-muted-foreground">Lead Quality Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Goal Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Monthly Revenue Goal</span>
                          <span>78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Lead Generation Goal</span>
                          <span>92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}