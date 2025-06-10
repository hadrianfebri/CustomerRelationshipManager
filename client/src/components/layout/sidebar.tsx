import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  Filter, 
  CheckSquare, 
  BarChart, 
  Mail,
  CreditCard,
  UsersIcon,
  Zap,
  MessageCircle,
  FileText
} from "lucide-react";
import UserMenu from "./user-menu";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Sales Pipeline", href: "/pipeline", icon: Filter },
  { name: "Tasks & Follow-ups", href: "/tasks", icon: CheckSquare },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Email Templates", href: "/email-templates", icon: Mail },
  { name: "WhatsApp Business", href: "/whatsapp", icon: MessageCircle },
  { name: "WhatsApp Templates", href: "/whatsapp-templates", icon: FileText },
  { name: "AI Automation", href: "/automation", icon: Zap },
  { name: "Team Management", href: "/team", icon: UsersIcon },
  { name: "Billing & Plans", href: "/billing", icon: CreditCard },
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
              <div className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-border">
        <UserMenu />
      </div>
    </div>
  );
}
