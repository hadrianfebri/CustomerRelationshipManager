import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import ContactList from "@/components/contacts/contact-list";
import AddContactModal from "@/components/modals/add-contact-modal";

export default function Contacts() {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts", { search: searchQuery }],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/contacts?search=${encodeURIComponent(searchQuery)}`
        : "/api/contacts";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
  });

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Contacts" 
        subtitle="Manage your customer relationships and contact information"
        onAddClick={() => setIsAddContactOpen(true)}
        onSearch={setSearchQuery}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <ContactList contacts={contacts} isLoading={isLoading} />
      </main>

      <AddContactModal 
        open={isAddContactOpen} 
        onOpenChange={setIsAddContactOpen} 
      />
    </div>
  );
}
