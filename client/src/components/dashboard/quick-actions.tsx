import { UserPlus, CheckSquare, Mail, FileText, BarChart, Settings } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      name: "Add Contact",
      action: "addContact",
      icon: UserPlus,
      color: "text-primary",
    },
    {
      name: "Create Task",
      action: "createTask",
      icon: CheckSquare,
      color: "text-accent",
    },
    {
      name: "Send Email",
      action: "scheduleEmail",
      icon: Mail,
      color: "text-warning",
    },
    {
      name: "Import Data",
      action: "importContacts",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      name: "Reports",
      action: "generateReport",
      icon: BarChart,
      color: "text-blue-600",
    },
    {
      name: "Settings",
      action: "manageSettings",
      icon: Settings,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.action}
              onClick={() => onAction(action.action)}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent transition-colors"
            >
              <Icon className={`h-8 w-8 ${action.color} mb-2`} />
              <span className="text-sm font-medium text-gray-900 dark:text-foreground text-center">
                {action.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
