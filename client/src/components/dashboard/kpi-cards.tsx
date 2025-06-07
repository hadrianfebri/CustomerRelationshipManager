import { TrendingUp, TrendingDown, Users, UserPlus, DollarSign, Percent } from "lucide-react";

interface KpiStats {
  totalContacts: number;
  activeLeads: number;
  totalRevenue: number;
  conversionRate: number;
}

interface KpiCardsProps {
  stats?: KpiStats;
}

export default function KpiCards({ stats }: KpiCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      trend: "+12%",
      isPositive: true,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-primary",
    },
    {
      title: "Active Leads", 
      value: stats.activeLeads.toLocaleString(),
      trend: "+8%",
      isPositive: true,
      icon: UserPlus,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-accent",
    },
    {
      title: "Revenue This Month",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      trend: "-3%",
      isPositive: false,
      icon: DollarSign,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-warning",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      trend: "+2.1%",
      isPositive: true,
      icon: Percent,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.isPositive ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="kpi-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                  {kpi.value}
                </p>
                <p className={`text-sm mt-1 flex items-center ${
                  kpi.isPositive ? 'text-accent' : 'text-destructive'
                }`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  {kpi.trend} from last month
                </p>
              </div>
              <div className={`w-12 h-12 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
