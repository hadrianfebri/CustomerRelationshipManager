import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Edit, Trash, Plus } from "lucide-react";
import { EmailTemplate } from "@shared/schema";

export default function EmailTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Email Templates" 
        subtitle="Manage your email templates for faster communication"
        onAddClick={() => console.log("Add template")}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 dark:text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No email templates found</h3>
                <p>Create your first email template to get started.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template: EmailTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-foreground">
                          {template.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600 dark:text-muted-foreground">
                          {template.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={template.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(template.createdAt || new Date())}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
