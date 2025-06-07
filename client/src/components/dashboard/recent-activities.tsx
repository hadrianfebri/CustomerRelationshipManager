import { Phone, Mail, Handshake, Calendar } from "lucide-react";
import { Activity } from "@shared/schema";

interface RecentActivitiesProps {
  activities?: Activity[];
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="p-6 border-b border-gray-200 dark:border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Recent Activities</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 dark:text-muted-foreground">
            No recent activities to display
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return Phone;
      case "email":
        return Mail;
      case "meeting":
        return Calendar;
      default:
        return Handshake;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-100 dark:bg-blue-900/30 text-primary";
      case "email":
        return "bg-green-100 dark:bg-green-900/30 text-accent";
      case "meeting":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-warning";
      default:
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
      <div className="p-6 border-b border-gray-200 dark:border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Recent Activities</h3>
          <button className="text-sm text-primary hover:text-primary/80">
            View All
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {activities.slice(0, 4).map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    {activity.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
                  {formatDate(activity.date || activity.createdAt || new Date())}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
