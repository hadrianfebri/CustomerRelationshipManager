import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Mail, Phone, Edit, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Contact } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditContactModal from "@/components/modals/edit-contact-modal";


interface ContactListProps {
  contacts?: Contact[];
  isLoading: boolean;
  onContactClick?: (contact: Contact) => void;
  selectedContactId?: number;
}

export default function ContactList({ contacts, isLoading, onContactClick, selectedContactId }: ContactListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-8 text-center">
        <div className="text-gray-500 dark:text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p>Get started by adding your first contact.</p>
        </div>
      </div>
    );
  }

  const getLeadStatusBadge = (status: string, score: number) => {
    if (score >= 80) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Hot</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Warm</Badge>;
    } else if (score >= 20) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Cold</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">New</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const handleEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditContact(contact);
    setIsEditModalOpen(true);
  };

  const handleSendEmail = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Follow up with ${contact.firstName} ${contact.lastName}`;
    const body = `Hi ${contact.firstName},\n\nI wanted to follow up with you regarding...`;
    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    toast({
      title: "Email Client Opened",
      description: `Composed email to ${contact.email}`,
    });
  };

  const handleCall = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact.phone) {
      const telUrl = `tel:${contact.phone}`;
      window.open(telUrl, '_self');
      
      toast({
        title: "Initiating Call",
        description: `Calling ${contact.firstName} at ${contact.phone}`,
      });
    } else {
      toast({
        title: "No Phone Number",
        description: "This contact doesn't have a phone number on file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (contactId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteContactMutation.mutate(contactId);
  };

  return (
    <>
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Lead Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
              <TableRow 
                key={contact.id}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedContactId === contact.id ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600' : ''
                }`}
                onClick={() => onContactClick?.(contact)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-foreground">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-muted-foreground">
                        {contact.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-foreground">
                      {contact.company || "—"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground">
                      {contact.position || "—"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getLeadStatusBadge(contact.leadStatus || "new", contact.leadScore || 0)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{contact.leadScore || 0}</span>
                </TableCell>
                <TableCell>
                  {formatDate(contact.lastContactDate)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEdit(contact, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSendEmail(contact, e)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleCall(contact, e)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDelete(contact.id, e)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    <EditContactModal 
      contact={editContact}
      open={isEditModalOpen}
      onOpenChange={setIsEditModalOpen}
    />
    </>
  );
}
