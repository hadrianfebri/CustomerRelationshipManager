import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Edit, Trash, Send, Users, Eye, Copy } from "lucide-react";
import EmailComposeModal from "@/components/email/email-compose-modal";
import type { Contact } from "@shared/schema";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(10, "Content must be at least 10 characters"),
  textContent: z.string().optional(),
  variables: z.array(z.string()).default([]),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: [],
    },
  });

  // Fetch email templates
  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email/templates"],
  });

  // Fetch contacts for bulk campaigns
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest("POST", "/api/email/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
      toast({
        title: "Template created",
        description: "Email template has been created successfully",
      });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create template",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("DELETE", `/api/email/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/templates"] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    setIsCreateModalOpen(true);
    form.reset();
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    form.setValue("name", template.name);
    form.setValue("subject", template.subject);
    form.setValue("htmlContent", template.htmlContent);
    form.setValue("textContent", template.textContent);
    form.setValue("variables", template.variables);
    setIsEditModalOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    const sampleData = {
      firstName: "John",
      lastName: "Doe",
      company: "Acme Corp",
      position: "CEO",
      email: "john@acme.com"
    };

    let previewHtml = template.htmlContent;
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const value = sampleData[variable as keyof typeof sampleData] || `[${variable}]`;
      previewHtml = previewHtml.replace(new RegExp(placeholder, 'g'), value);
    });

    setPreviewContent(previewHtml);
    setIsPreviewModalOpen(true);
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.htmlContent);
    toast({
      title: "Template copied",
      description: "Template content has been copied to clipboard",
    });
  };

  const handleBulkCampaign = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsBulkEmailModalOpen(true);
  };

  const onSubmit = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return Array.from(new Set(matches.map(match => match.slice(2, -2).trim())));
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    form.setValue("variables", variables);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Email Templates</h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            Create and manage email templates for your campaigns
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {template.variables.length} variables
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Variables:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkCampaign(template)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Bulk Send
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              No email templates yet
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-4">
              Create your first email template to get started with campaigns
            </p>
            <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        if (!open) form.reset();
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? 'Edit Email Template' : 'Create Email Template'}
            </DialogTitle>
            <DialogDescription>
              Create reusable email templates with dynamic variables
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your email content with variables like {{firstName}}, {{company}}, etc."
                        className="min-h-[200px] resize-none"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleContentChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Use double curly braces for variables: {"{{firstName}}, {{company}}, {{position}}"}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("variables").length > 0 && (
                <div>
                  <FormLabel>Detected Variables</FormLabel>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.watch("variables").map((variable, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTemplateMutation.isPending ? "Saving..." : isEditModalOpen ? "Update Template" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border rounded-lg p-4 bg-white dark:bg-gray-900"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
          <DialogFooter>
            <Button onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Modal */}
      {selectedTemplate && (
        <EmailComposeModal
          contact={null}
          contacts={contacts}
          open={isBulkEmailModalOpen}
          onOpenChange={setIsBulkEmailModalOpen}
          mode="bulk"
        />
      )}
    </div>
  );
}