import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import AddDealModal from "@/components/modals/add-deal-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  CheckCircle
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

  const getDealsByStage = (stage: string) => {
    const enrichedDeals = enrichDealsWithContacts(deals);
    return enrichedDeals.filter(deal => deal.stage === stage);
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
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Deal
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
    </div>
  );
}
