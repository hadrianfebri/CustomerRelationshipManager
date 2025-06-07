import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contact } from "@shared/schema";

interface TopContactsProps {
  contacts?: Contact[];
}

export default function TopContacts({ contacts }: TopContactsProps) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="p-6 border-b border-gray-200 dark:border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">High-Value Contacts</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 dark:text-muted-foreground">
            No contacts to display
          </div>
        </div>
      </div>
    );
  }

  const getLeadStatusBadge = (status: string, score: number) => {
    if (score >= 80) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Hot Lead</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Warm Lead</Badge>;
    } else if (score >= 20) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Cold Lead</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">New Lead</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
      <div className="p-6 border-b border-gray-200 dark:border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">High-Value Contacts</h3>
          <button className="text-sm text-primary hover:text-primary/80">
            View All Contacts
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-border">
        {contacts.map((contact) => (
          <div 
            key={contact.id} 
            className="p-6 hover:bg-gray-50 dark:hover:bg-accent transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{getInitials(contact.firstName, contact.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    {contact.firstName} {contact.lastName}
                  </p>
                  {contact.company && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      {contact.company}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {contact.email}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  {getLeadStatusBadge(contact.leadStatus || "new", contact.leadScore || 0)}
                  <span className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    Score: {contact.leadScore || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Last contact: {formatDate(contact.lastContactDate)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
