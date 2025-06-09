import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Leads from "@/pages/leads";
import Pipeline from "@/pages/pipeline";
import Tasks from "@/pages/tasks";
import Reports from "@/pages/reports";
import EmailTemplates from "@/pages/email-templates";
import Billing from "@/pages/billing";
import Team from "@/pages/team";
import Automation from "@/pages/automation";
import Landing from "@/pages/landing";
import JoinTeam from "@/pages/join-team";
import Login from "@/pages/login";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes for non-authenticated users */}
      <Route path="/join-team" component={JoinTeam} />
      <Route path="/login" component={Login} />
      
      {/* Protected routes */}
      {!isAuthenticated ? (
        <Route path="*" component={Landing} />
      ) : (
        <Route path="*">
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/contacts" component={Contacts} />
                <Route path="/leads" component={Leads} />
                <Route path="/pipeline" component={Pipeline} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/reports" component={Reports} />
                <Route path="/email-templates" component={EmailTemplates} />
                <Route path="/automation" component={Automation} />
                <Route path="/billing" component={Billing} />
                <Route path="/team" component={Team} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </div>
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
