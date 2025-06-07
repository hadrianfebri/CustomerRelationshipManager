import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  Filter, 
  CheckSquare, 
  BarChart, 
  Mail 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Sales Pipeline", href: "/pipeline", icon: Filter },
  { name: "Tasks & Follow-ups", href: "/tasks", icon: CheckSquare },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Email Templates", href: "/email-templates", icon: Mail },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-card shadow-lg border-r border-gray-200 dark:border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-primary-foreground text-sm" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-foreground">SalesPro CRM</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground">John Smith</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">Sales Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
