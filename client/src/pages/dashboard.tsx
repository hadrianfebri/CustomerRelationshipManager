import TopBar from "@/components/layout/topbar";
import KpiCards from "@/components/dashboard/kpi-cards";
import PipelineChart from "@/components/dashboard/pipeline-chart";
import LeadScoreDistribution from "@/components/dashboard/lead-score-distribution";
import RecentActivities from "@/components/dashboard/recent-activities";
import TopContacts from "@/components/dashboard/top-contacts";
import QuickActions from "@/components/dashboard/quick-actions";
import AutomationPanel from "@/components/dashboard/automation-panel";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AddContactModal from "@/components/modals/add-contact-modal";
import AddTaskModal from "@/components/modals/add-task-modal";

export default function Dashboard() {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  }) as { data?: any; isLoading: boolean };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "addContact":
        setIsAddContactOpen(true);
        break;
      case "createTask":
        setIsAddTaskOpen(true);
        break;
      default:
        console.log("Quick action:", action);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar 
          title="Dashboard" 
          subtitle="Loading dashboard data..." 
        />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Dashboard" 
        subtitle="Welcome back, John! Here's what's happening with your sales today."
        onAddClick={() => setIsAddContactOpen(true)}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards stats={dashboardStats?.kpis} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PipelineChart data={dashboardStats?.pipelineData} />
          <LeadScoreDistribution data={dashboardStats?.leadScoreDistribution} />
        </div>

        {/* Activities and Contacts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentActivities activities={dashboardStats?.recentActivities} />
          <TopContacts contacts={dashboardStats?.topContacts} />
        </div>

        {/* Automation and Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AutomationPanel />
          <QuickActions onAction={handleQuickAction} />
        </div>
      </main>

      <AddContactModal 
        open={isAddContactOpen} 
        onOpenChange={setIsAddContactOpen} 
      />
      
      <AddTaskModal 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen} 
      />
    </div>
  );
}
