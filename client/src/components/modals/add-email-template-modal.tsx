import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailTemplateSchema, type InsertEmailTemplate } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddEmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddEmailTemplateModal({ open, onOpenChange }: AddEmailTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertEmailTemplate>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      category: "",
      isActive: true,
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertEmailTemplate) => {
      const response = await apiRequest("POST", "/api/email-templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Email template created",
        description: "The email template has been successfully created.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create email template.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertEmailTemplate) => {
    createTemplateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Email Template</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Welcome Email"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => form.setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="nurture">Nurture</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              {...form.register("subject")}
              placeholder="Welcome to our platform, {firstName}!"
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              {...form.register("body")}
              placeholder="Hi {firstName},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team"
              rows={8}
              className="font-mono text-sm"
            />
            {form.formState.errors.body && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active Template</Label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
              Available Merge Tags:
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {"{"}firstName{"}"}, {"{"}lastName{"}"}, {"{"}email{"}"}, {"{"}company{"}"}, {"{"}position{"}"}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTemplateMutation.isPending}>
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}