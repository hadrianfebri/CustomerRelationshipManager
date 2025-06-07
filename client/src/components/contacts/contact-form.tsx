import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertContactSchema, type Contact, type InsertContact } from "@shared/schema";

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: InsertContact) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ContactForm({ 
  contact, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  submitLabel = "Save Contact"
}: ContactFormProps) {
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      leadScore: 0,
      leadStatus: "new",
      source: "",
      notes: "",
    },
  });

  // Update form when contact prop changes (for editing)
  useEffect(() => {
    if (contact) {
      form.reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        position: contact.position || "",
        leadScore: contact.leadScore || 0,
        leadStatus: contact.leadStatus || "new",
        source: contact.source || "",
        notes: contact.notes || "",
      });
    }
  }, [contact, form]);

  const handleSubmit = (data: InsertContact) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4">
            Basic Information
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              placeholder="John"
              className="mt-1"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              placeholder="Doe"
              className="mt-1"
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="john.doe@example.com"
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4">
            Company Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              {...form.register("company")}
              placeholder="Acme Corporation"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="position">Position/Title</Label>
            <Input
              id="position"
              {...form.register("position")}
              placeholder="Chief Executive Officer"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Lead Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4">
            Lead Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="leadStatus">Lead Status</Label>
            <Select
              value={form.watch("leadStatus")}
              onValueChange={(value) => form.setValue("leadStatus", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leadScore">Lead Score (0-100)</Label>
            <Input
              id="leadScore"
              type="number"
              min="0"
              max="100"
              {...form.register("leadScore", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="source">Lead Source</Label>
            <Input
              id="source"
              {...form.register("source")}
              placeholder="Website, Referral, Cold Call..."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Additional notes about this contact..."
          rows={4}
          className="mt-1"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
