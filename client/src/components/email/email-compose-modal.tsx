import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2, Sparkles, User, Users } from "lucide-react";
import { z } from "zod";
import type { Contact } from "@shared/schema";

const emailSchema = z.object({
  emailType: z.enum(["follow-up", "welcome", "custom"]),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  customMessage: z.string().optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailComposeModalProps {
  contact: Contact | null;
  contacts: Contact[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'single' | 'bulk';
}

export default function EmailComposeModal({ 
  contact, 
  contacts, 
  open, 
  onOpenChange, 
  mode 
}: EmailComposeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      emailType: "follow-up",
      subject: "",
      content: "",
      customMessage: "",
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      if (mode === 'single' && contact) {
        if (data.emailType === "follow-up") {
          return await apiRequest("POST", "/api/email/send-follow-up", {
            contactId: contact.id,
            customMessage: data.customMessage
          });
        } else if (data.emailType === "welcome") {
          return await apiRequest("POST", "/api/email/send-welcome", {
            contactId: contact.id
          });
        } else {
          return await apiRequest("POST", "/api/email/send-follow-up", {
            contactId: contact.id,
            customMessage: data.content
          });
        }
      } else if (mode === 'bulk') {
        return await apiRequest("POST", "/api/email/send-bulk-campaign", {
          contactIds: selectedContacts,
          subject: data.subject,
          htmlContent: data.content,
          textContent: data.content
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Email sent successfully",
        description: mode === 'single' 
          ? `Email sent to ${contact?.firstName} ${contact?.lastName}`
          : `Campaign sent to ${selectedContacts.length} contacts`,
      });
      onOpenChange(false);
      form.reset();
      setSelectedContacts([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const generateEmailContent = async () => {
    if (!contact && mode === 'single') return;
    
    setIsGeneratingContent(true);
    try {
      // For now, use template-based generation
      const template = getEmailTemplates();
      form.setValue("subject", template.subject);
      form.setValue("content", template.content);
      
      toast({
        title: "Email template applied",
        description: "Template content has been loaded for customization",
      });
    } catch (error: any) {
      toast({
        title: "Failed to generate content",
        description: error.message || "Please try writing manually",
        variant: "destructive",
      });
    }
    setIsGeneratingContent(false);
  };

  const getEmailTemplates = () => {
    const emailType = form.watch("emailType");
    switch (emailType) {
      case "follow-up":
        return {
          subject: `Following up with you, ${contact?.firstName || "there"}`,
          content: `Hi ${contact?.firstName || "there"},\n\nI wanted to follow up on our previous conversation. I believe our solution could be a great fit for ${contact?.company || "your organization"}.\n\nWould you be available for a brief call this week to discuss further?\n\nBest regards`
        };
      case "welcome":
        return {
          subject: `Welcome ${contact?.firstName || ""}! Let's get started`,
          content: `Hi ${contact?.firstName || ""},\n\nWelcome to our community! We're excited to work with ${contact?.company || "you"}.\n\nHere's what you can expect next:\n- A discovery call to understand your needs\n- Customized solutions for your business\n- Ongoing support from our team\n\nLooking forward to our partnership!`
        };
      default:
        return {
          subject: "",
          content: ""
        };
    }
  };

  const applyTemplate = () => {
    const template = getEmailTemplates();
    form.setValue("subject", template.subject);
    form.setValue("content", template.content);
  };

  const onSubmit = (data: EmailFormData) => {
    if (mode === 'bulk' && selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact for the campaign",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'single' ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {mode === 'single' 
              ? `Send Email to ${contact?.firstName} ${contact?.lastName}`
              : "Send Bulk Email Campaign"
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'single'
              ? "Send a personalized email to this contact"
              : "Send an email campaign to multiple contacts"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'bulk' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Recipients</label>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {contacts.map((contactItem) => (
                    <label key={contactItem.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contactItem.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contactItem.id]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contactItem.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {contactItem.firstName} {contactItem.lastName} ({contactItem.email})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedContacts.length} contact(s) selected
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="emailType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="follow-up">Follow-up Email</SelectItem>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="custom">Custom Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(form.watch("emailType") === "custom" || mode === 'bulk') && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyTemplate}
                disabled={form.watch("emailType") === "custom"}
              >
                <Mail className="w-4 h-4 mr-2" />
                Use Template
              </Button>
              {mode === 'single' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateEmailContent}
                  disabled={isGeneratingContent}
                >
                  {isGeneratingContent ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGeneratingContent ? "Generating..." : "AI Generate"}
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your email content..."
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("emailType") !== "custom" && mode === 'single' && (
              <FormField
                control={form.control}
                name="customMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any custom message to personalize the email..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendEmailMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}