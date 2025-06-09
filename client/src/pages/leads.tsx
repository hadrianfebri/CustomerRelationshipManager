import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Mail, Phone, Edit, TrendingUp, Zap, Filter, Plus, Calendar, Target, Users, CheckSquare, ArrowUpDown, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmailComposeModal from "@/components/email/email-compose-modal";
import MeetingSchedulerModal from "@/components/calendar/meeting-scheduler-modal";

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "score" | "date">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"email" | "update-status" | "score" | "schedule" | "">("");
  const [bulkActionData, setBulkActionData] = useState<any>({});
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/leads", { 
      status: statusFilter !== "all" ? statusFilter : undefined, 
      score: scoreFilter !== "all" ? scoreFilter : undefined,
      search: searchQuery || undefined,
      sortBy,
      sortOrder
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (scoreFilter !== "all") params.append("score", scoreFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      
      const response = await fetch(`/api/leads?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/conversion-funnel"],
  }) as { data?: { funnel: any; conversionRates: any } };

  const leadScoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/workflows/lead-scoring");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lead scoring completed",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run lead scoring",
        variant: "destructive",
      });
    },
  });

  const updateLeadScoreMutation = useMutation({
    mutationFn: async ({ id, leadScore, leadStatus }: { id: number; leadScore?: number; leadStatus?: string }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}/score`, { leadScore, leadStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lead updated",
        description: "Lead score and status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, leadIds, data }: { 
      action: string; 
      leadIds: number[]; 
      data?: any 
    }) => {
      return await apiRequest("POST", "/api/leads/bulk-action", {
        action,
        leadIds,
        data
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setSelectedLeads([]);
      setShowBulkDialog(false);
      toast({
        title: "Bulk action completed",
        description: `Successfully processed ${variables.leadIds.length} leads`,
      });
    },
  });

  // Helper functions
  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads?.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads?.map((lead: Contact) => lead.id) || []);
    }
  };

  const handleBulkAction = (action: "email" | "update-status" | "score" | "schedule") => {
    setBulkAction(action);
    setBulkActionData({}); // Reset data
    setShowBulkDialog(true);
  };

  const executeBulkAction = () => {
    if (!bulkAction || selectedLeads.length === 0) return;
    
    let data = { ...bulkActionData };
    
    // Set defaults if no data provided
    if (bulkAction === "update-status" && !data.leadStatus) {
      data.leadStatus = "warm";
    } else if (bulkAction === "score" && !data.leadScore) {
      data.leadScore = 10;
    } else if (bulkAction === "email") {
      data = { 
        ...data,
        customMessage: data.customMessage || "Thank you for your interest in our services. We'd love to discuss how we can help your business grow and achieve your goals.",
        subject: data.subject || "Following up on your interest"
      };
    } else if (bulkAction === "schedule") {
      data = { 
        ...data,
        taskType: "follow-up",
        priority: "medium"
      };
    }

    bulkActionMutation.mutate({
      action: bulkAction,
      leadIds: selectedLeads,
      data
    });
  };

  const handleSort = (column: "name" | "score" | "date") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getLeadStatusBadge = (status: string, score: number) => {
    if (score >= 80) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Hot</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Warm</Badge>;
    } else if (score >= 20) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Cold</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">New</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Lead Management" 
        subtitle="Track, score, and manage your sales leads and prospects"
        onSearch={setSearchQuery}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">Lead List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            {/* Filters and Bulk Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium">Search Leads</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Minimum Score</label>
                      <Select value={scoreFilter} onValueChange={setScoreFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scores</SelectItem>
                          <SelectItem value="80">80+ (Hot)</SelectItem>
                          <SelectItem value="50">50+ (Warm+)</SelectItem>
                          <SelectItem value="20">20+ (Cold+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Bulk Actions
                    {selectedLeads.length > 0 && (
                      <Badge className="ml-2">{selectedLeads.length} selected</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("email")}
                        disabled={selectedLeads.length === 0}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Send Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("update-status")}
                        disabled={selectedLeads.length === 0}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Update Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("score")}
                        disabled={selectedLeads.length === 0}
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Boost Score
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("schedule")}
                        disabled={selectedLeads.length === 0}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Select leads to perform bulk actions</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => leadScoringMutation.mutate()}
                        disabled={leadScoringMutation.isPending}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        {leadScoringMutation.isPending ? "Scoring..." : "AI Score All"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leads Table */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
              {isLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : !leads || leads.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500 dark:text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No leads found</h3>
                    <p>No leads match your current filters.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedLeads.length === leads?.length && leads.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            Lead
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort("score")}
                        >
                          <div className="flex items-center">
                            Score
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center">
                            Last Contact
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead: Contact) => (
                        <TableRow key={lead.id} className={selectedLeads.includes(lead.id) ? "bg-blue-50 dark:bg-blue-950/20" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => toggleLeadSelection(lead.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>
                                  {getInitials(lead.firstName, lead.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-foreground">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-muted-foreground">
                                  {lead.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-foreground">
                                {lead.company || "—"}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-muted-foreground">
                                {lead.position || "—"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLeadStatusBadge(lead.leadStatus || "new", lead.leadScore || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{lead.leadScore || 0}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateLeadScoreMutation.mutate({ 
                                  id: lead.id, 
                                  leadScore: Math.min((lead.leadScore || 0) + 10, 100) 
                                })}
                              >
                                +10
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.source || "—"}
                          </TableCell>
                          <TableCell>
                            {formatDate(lead.lastContactDate)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContact(lead);
                                    setEmailModalOpen(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContact(lead);
                                    setMeetingModalOpen(true);
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Schedule Meeting
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => updateLeadScoreMutation.mutate({ 
                                    id: lead.id, 
                                    leadStatus: "hot" 
                                  })}
                                >
                                  <Target className="h-4 w-4 mr-2" />
                                  Mark as Hot
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateLeadScoreMutation.mutate({ 
                                    id: lead.id, 
                                    leadScore: Math.min((lead.leadScore || 0) + 10, 100) 
                                  })}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Boost Score (+10)
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContact(lead);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>Lead progression through sales stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Leads</span>
                        <span className="font-bold">{analytics.funnel?.totalLeads || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Qualified Leads</span>
                        <span className="font-bold">{analytics.funnel?.qualifiedLeads || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Proposal Stage</span>
                        <span className="font-bold">{analytics.funnel?.proposalStage || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Negotiation</span>
                        <span className="font-bold">{analytics.funnel?.negotiationStage || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Closed Won</span>
                        <span className="font-bold text-green-600">{analytics.funnel?.closedWon || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rates</CardTitle>
                    <CardDescription>Percentage conversion at each stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Lead → Qualified</span>
                        <span className="font-bold">{analytics.conversionRates?.leadToQualified || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Qualified → Proposal</span>
                        <span className="font-bold">{analytics.conversionRates?.qualifiedToProposal || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Proposal → Negotiation</span>
                        <span className="font-bold">{analytics.conversionRates?.proposalToNegotiation || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Negotiation → Close</span>
                        <span className="font-bold text-green-600">{analytics.conversionRates?.negotiationToClose || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="animate-pulse text-gray-400">Loading analytics...</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Automated Lead Scoring
                </CardTitle>
                <CardDescription>
                  Run automated lead scoring to update all contact scores based on predefined criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Scoring Criteria:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Company information: +10 points</li>
                      <li>• Senior position (CEO, CTO, VP): +20 points</li>
                      <li>• Referral source: +15 points</li>
                      <li>• Website source: +10 points</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => leadScoringMutation.mutate()}
                    disabled={leadScoringMutation.isPending}
                    className="w-full"
                  >
                    {leadScoringMutation.isPending ? "Running Lead Scoring..." : "Run Lead Scoring"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bulk Action Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Action: {bulkAction}</DialogTitle>
              <DialogDescription>
                Apply action to {selectedLeads.length} selected leads
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {bulkAction === "email" && (
                <div className="space-y-4">
                  <p>Send bulk email campaign to selected leads</p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This will send emails to {selectedLeads.length} selected leads
                    </p>
                  </div>
                </div>
              )}
              
              {bulkAction === "update-status" && (
                <div className="space-y-4">
                  <p>Update lead status for all selected leads</p>
                  <Select 
                    defaultValue="warm" 
                    onValueChange={(value) => setBulkActionData({...bulkActionData, leadStatus: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkAction === "score" && (
                <div className="space-y-4">
                  <p>Boost lead scores by +10 points for all selected leads</p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This will increase each lead's score by 10 points (maximum 100)
                    </p>
                  </div>
                </div>
              )}
              
              {bulkAction === "schedule" && (
                <div className="space-y-4">
                  <p>Schedule follow-up meetings for selected leads</p>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This will create follow-up tasks for {selectedLeads.length} selected leads
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeBulkAction}
                disabled={bulkActionMutation.isPending}
              >
                {bulkActionMutation.isPending ? "Processing..." : "Execute Action"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Compose Modal */}
        {emailModalOpen && (
          <EmailComposeModal
            open={emailModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEmailModalOpen(false);
                setSelectedContact(null);
              }
            }}
            contact={selectedContact}
            contacts={selectedLeads.length > 1 ? 
              leads?.filter((lead: Contact) => selectedLeads.includes(lead.id)) || [] : 
              selectedContact ? [selectedContact] : []
            }
            mode={selectedLeads.length > 1 ? 'bulk' : 'single'}
          />
        )}

        {/* Meeting Scheduler Modal */}
        {meetingModalOpen && (
          <MeetingSchedulerModal
            open={meetingModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                setMeetingModalOpen(false);
                setSelectedContact(null);
              }
            }}
            contact={selectedContact}
          />
        )}

        {/* Edit Contact Modal */}
        {editModalOpen && selectedContact && (
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Lead Details</DialogTitle>
                <DialogDescription>
                  Update information for {selectedContact.firstName} {selectedContact.lastName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input 
                      defaultValue={selectedContact.firstName} 
                      onChange={(e) => setSelectedContact({...selectedContact, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input 
                      defaultValue={selectedContact.lastName} 
                      onChange={(e) => setSelectedContact({...selectedContact, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    defaultValue={selectedContact.email} 
                    onChange={(e) => setSelectedContact({...selectedContact, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input 
                    defaultValue={selectedContact.company || ""} 
                    onChange={(e) => setSelectedContact({...selectedContact, company: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <Input 
                    defaultValue={selectedContact.position || ""} 
                    onChange={(e) => setSelectedContact({...selectedContact, position: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input 
                    defaultValue={selectedContact.phone || ""} 
                    onChange={(e) => setSelectedContact({...selectedContact, phone: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lead Score</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      defaultValue={selectedContact.leadScore || 0} 
                      onChange={(e) => setSelectedContact({...selectedContact, leadScore: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      defaultValue={selectedContact.leadStatus || "new"}
                      onValueChange={(value) => setSelectedContact({...selectedContact, leadStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await apiRequest("PATCH", `/api/contacts/${selectedContact.id}`, {
                        firstName: selectedContact.firstName,
                        lastName: selectedContact.lastName,
                        email: selectedContact.email,
                        company: selectedContact.company,
                        position: selectedContact.position,
                        phone: selectedContact.phone,
                        leadScore: selectedContact.leadScore,
                        leadStatus: selectedContact.leadStatus
                      });
                      
                      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
                      
                      toast({
                        title: "Contact updated",
                        description: "Lead details have been saved successfully",
                      });
                      
                      setEditModalOpen(false);
                      setSelectedContact(null);
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update contact details",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
