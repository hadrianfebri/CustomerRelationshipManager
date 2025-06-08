import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import ContactList from "@/components/contacts/contact-list";
import AddContactModal from "@/components/modals/add-contact-modal";
import AIContactInsights from "@/components/contacts/ai-contact-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";

export default function Contacts() {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isRunningBulkAI, setIsRunningBulkAI] = useState(false);
  const { toast } = useToast();

  const { data: contacts, isLoading, refetch } = useQuery({
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

  const runBulkAIScoring = async () => {
    setIsRunningBulkAI(true);
    try {
      const response = await fetch("/api/ai/auto-score-all-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "AI Scoring Complete",
          description: `Updated scores for ${data.processed} contacts`,
        });
        refetch();
      } else {
        throw new Error("AI service unavailable");
      }
    } catch (error) {
      toast({
        title: "AI Service Required",
        description: "Configure DeepSeek API key to enable AI features",
        variant: "destructive",
      });
    } finally {
      setIsRunningBulkAI(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(selectedContact?.id === contact.id ? null : contact);
  };

  const handleScoreUpdate = () => {
    refetch();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar 
        title="Contacts" 
        subtitle="Manage your customer relationships and contact information"
        onAddClick={() => setIsAddContactOpen(true)}
        onSearch={setSearchQuery}
      />
      
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-background">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Contact Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Use AI to analyze all contacts and update lead scores automatically
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click on any contact below to see individual AI insights
                  </p>
                </div>
                <Button 
                  onClick={runBulkAIScoring}
                  disabled={isRunningBulkAI}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isRunningBulkAI ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactList 
              contacts={contacts} 
              isLoading={isLoading} 
              onContactClick={handleContactSelect}
              selectedContactId={selectedContact?.id}
            />
          </div>
          
          {selectedContact && (
            <div className="lg:col-span-1">
              <AIContactInsights 
                contact={selectedContact}
                onScoreUpdate={handleScoreUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <AddContactModal 
        open={isAddContactOpen} 
        onOpenChange={setIsAddContactOpen} 
      />
    </div>
  );
}
