import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import AddDealModal from "@/components/modals/add-deal-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  Calendar, 
  User, 
  MoreVertical, 
  Edit, 
  Trash, 
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Mail,
  Phone,
  FileText,
  BarChart3
} from "lucide-react";
import { Deal, Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const pipelineStages = [
  { 
    id: "prospecting", 
    title: "Prospecting", 
    color: "bg-gray-100 dark:bg-gray-800",
    icon: Target,
    description: "Initial contact and qualification"
  },
  { 
    id: "qualified", 
    title: "Qualified", 
    color: "bg-blue-100 dark:bg-blue-900/30",
    icon: User,
    description: "Qualified leads ready for proposal"
  },
  { 
    id: "proposal", 
    title: "Proposal", 
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Clock,
    description: "Proposal sent, awaiting response"
  },
  { 
    id: "negotiation", 
    title: "Negotiation", 
    color: "bg-orange-100 dark:bg-orange-900/30",
    icon: TrendingUp,
    description: "In active negotiation"
  },
  { 
    id: "closed-won", 
    title: "Closed Won", 
    color: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle,
    description: "Successfully closed deals"
  },
  { 
    id: "closed-lost", 
    title: "Closed Lost", 
    color: "bg-red-100 dark:bg-red-900/30",
    icon: Trash,
    description: "Lost opportunities"
  },
];

interface DealWithContact extends Deal {
  contact?: Contact;
}

export default function Pipeline() {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [editDealOpen, setEditDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterProbability, setFilterProbability] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/deals"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/deals/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Deal deleted",
        description: "The deal has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal",
        variant: "destructive",
      });
    },
  });

  const updateDealStageMutation = useMutation({
    mutationFn: async ({ id, stage, probability }: { id: number; stage: string; probability: number }) => {
      const response = await apiRequest("PATCH", `/api/deals/${id}`, { stage, probability });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Deal updated",
        description: "Deal stage has been updated.",
      });
    },
  });

  const enrichDealsWithContacts = (deals: Deal[]): DealWithContact[] => {
    return deals.map(deal => ({
      ...deal,
      contact: contacts.find((c: Contact) => c.id === deal.contactId)
    }));
  };

  const getFilteredDeals = () => {
    const safeDeals = Array.isArray(deals) ? deals : [];
    const enrichedDeals = enrichDealsWithContacts(safeDeals);
    
    return enrichedDeals.filter(deal => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesTitle = deal.title?.toLowerCase().includes(searchLower);
        const matchesContact = deal.contact ? 
          `${deal.contact.firstName} ${deal.contact.lastName}`.toLowerCase().includes(searchLower) ||
          deal.contact.company?.toLowerCase().includes(searchLower) : false;
        
        if (!matchesTitle && !matchesContact) return false;
      }
      
      // Stage filter
      if (filterStage !== "all" && deal.stage !== filterStage) return false;
      
      // Probability filter
      if (filterProbability !== "all") {
        const prob = deal.probability || 0;
        switch (filterProbability) {
          case "high": if (prob < 75) return false; break;
          case "medium": if (prob < 50 || prob >= 75) return false; break;
          case "low": if (prob >= 50) return false; break;
        }
      }
      
      return true;
    });
  };

  const getDealsByStage = (stage: string) => {
    const filteredDeals = getFilteredDeals();
    return filteredDeals.filter(deal => deal.stage === stage);
  };

  const getStageValue = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value || "0"), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "text-green-600";
    if (probability >= 50) return "text-yellow-600";
    if (probability >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleStageChange = (dealId: number, newStage: string) => {
    const stageProbabilities: Record<string, number> = {
      "prospecting": 10,
      "qualified": 25,
      "proposal": 50,
      "negotiation": 75,
      "closed-won": 100,
      "closed-lost": 0,
    };
    
    updateDealStageMutation.mutate({
      id: dealId,
      stage: newStage,
      probability: stageProbabilities[newStage] || 10
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar 
          title="Sales Pipeline" 
          subtitle="Visualize and manage your sales opportunities"
          onAddClick={() => setIsAddDealOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Sales Pipeline" 
        subtitle="Visualize and manage your sales opportunities"
        onAddClick={() => setIsAddDealOpen(true)}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        {/* Search and Filters */}
        <div className="mb-6 bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deals, contacts, or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterProbability} onValueChange={setFilterProbability}>
                <SelectTrigger className="w-40">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Probability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Probabilities</SelectItem>
                  <SelectItem value="high">High (75%+)</SelectItem>
                  <SelectItem value="medium">Medium (50-74%)</SelectItem>
                  <SelectItem value="low">Low (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchQuery || filterStage !== "all" || filterProbability !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStage("all");
                    setFilterProbability("all");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Pipeline Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Pipeline</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(pipelineStages.reduce((sum, stage) => sum + getStageValue(stage.id), 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Deals</p>
                  <p className="text-2xl font-bold">
                    {getFilteredDeals().filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Deal Size</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(getFilteredDeals().length > 0 ? 
                      getFilteredDeals().reduce((sum, deal) => sum + parseFloat(deal.value || "0"), 0) / getFilteredDeals().length : 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Close Rate</p>
                  <p className="text-2xl font-bold">
                    {getFilteredDeals().length > 0 ? 
                      Math.round((getDealsByStage('closed-won').length / getFilteredDeals().filter(d => ['closed-won', 'closed-lost'].includes(d.stage)).length) * 100) || 0 : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {pipelineStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const IconComponent = stage.icon;
            
            return (
              <Card key={stage.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${stage.color}`}>
                      <IconComponent className="h-3 w-3" />
                    </div>
                    {stage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stageDeals.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(stageValue)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pipeline Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-full">
          {pipelineStages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            
            return (
              <div key={stage.id} className="space-y-4">
                <div className={`${stage.color} rounded-lg p-3`}>
                  <h3 className="font-semibold text-sm">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                  <div className="text-xs font-medium mt-2">
                    {stageDeals.length} deals • {formatCurrency(getStageValue(stage.id))}
                  </div>
                </div>

                <div className="space-y-3 min-h-[400px]">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {pipelineStages
                                .filter(s => s.id !== deal.stage)
                                .map(targetStage => (
                                  <DropdownMenuItem
                                    key={targetStage.id}
                                    onClick={() => handleStageChange(deal.id, targetStage.id)}
                                  >
                                    Move to {targetStage.title}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              {deal.contact && (
                                <>
                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Contact
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Meeting
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setEditDealOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Deal
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Notes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteDealMutation.mutate(deal.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(parseFloat(deal.value || "0"))}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={getProbabilityColor(deal.probability || 0)}
                            >
                              {deal.probability}%
                            </Badge>
                          </div>

                          {deal.contact && (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(deal.contact.firstName, deal.contact.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {deal.contact.firstName} {deal.contact.lastName}
                              </span>
                            </div>
                          )}

                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(deal.expectedCloseDate), "MMM dd")}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AddDealModal 
        open={isAddDealOpen} 
        onOpenChange={setIsAddDealOpen} 
      />

      {/* Edit Deal Modal */}
      {editDealOpen && selectedDeal && (
        <Dialog open={editDealOpen} onOpenChange={setEditDealOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Deal</DialogTitle>
              <DialogDescription>
                Update deal information and stage
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium">Deal Title</label>
                <Input 
                  defaultValue={selectedDeal.title} 
                  onChange={(e) => setSelectedDeal({...selectedDeal, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Deal Value</label>
                <Input 
                  type="number" 
                  defaultValue={selectedDeal.value || ""} 
                  onChange={(e) => setSelectedDeal({...selectedDeal, value: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stage</label>
                  <Select 
                    defaultValue={selectedDeal.stage || "prospecting"}
                    onValueChange={(value) => setSelectedDeal({...selectedDeal, stage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Probability (%)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    defaultValue={selectedDeal.probability || 0} 
                    onChange={(e) => setSelectedDeal({...selectedDeal, probability: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Expected Close Date</label>
                <Input 
                  type="date" 
                  defaultValue={selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toISOString().split('T')[0] : ""} 
                  onChange={(e) => setSelectedDeal({...selectedDeal, expectedCloseDate: new Date(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input 
                  placeholder="Add deal notes..."
                  defaultValue={selectedDeal.notes || ""} 
                  onChange={(e) => setSelectedDeal({...selectedDeal, notes: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDealOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await apiRequest("PATCH", `/api/deals/${selectedDeal.id}`, {
                      title: selectedDeal.title,
                      value: selectedDeal.value,
                      stage: selectedDeal.stage,
                      probability: selectedDeal.probability,
                      expectedCloseDate: selectedDeal.expectedCloseDate,
                      description: selectedDeal.description
                    });
                    
                    queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
                    
                    toast({
                      title: "Deal updated",
                      description: "Deal information has been saved successfully",
                    });
                    
                    setEditDealOpen(false);
                    setSelectedDeal(null);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to update deal information",
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
    </div>
  );
}
