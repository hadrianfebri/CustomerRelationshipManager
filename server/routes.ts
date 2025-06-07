import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertActivitySchema, insertTaskSchema, insertDealSchema, insertEmailTemplateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contacts routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const { search } = req.query;
      let contacts;
      
      if (search && typeof search === "string") {
        contacts = await storage.searchContacts(search);
      } else {
        contacts = await storage.getAllContacts();
      }
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, contactData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContact(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { contactId } = req.query;
      let activities;
      
      if (contactId && typeof contactId === "string") {
        activities = await storage.getContactActivities(parseInt(contactId));
      } else {
        activities = await storage.getAllActivities();
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { contactId } = req.query;
      let tasks;
      
      if (contactId && typeof contactId === "string") {
        tasks = await storage.getContactTasks(parseInt(contactId));
      } else {
        tasks = await storage.getAllTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Deals routes
  app.get("/api/deals", async (req, res) => {
    try {
      const { contactId } = req.query;
      let deals;
      
      if (contactId && typeof contactId === "string") {
        deals = await storage.getContactDeals(parseInt(contactId));
      } else {
        deals = await storage.getAllDeals();
      }
      
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dealData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(id, dealData);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDeal(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Email Templates routes
  app.get("/api/email-templates", async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.get("/api/email-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  app.post("/api/email-templates", async (req, res) => {
    try {
      const templateData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.patch("/api/email-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateEmailTemplate(id, templateData);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmailTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Dashboard analytics route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      const activities = await storage.getAllActivities();
      const deals = await storage.getAllDeals();
      const tasks = await storage.getAllTasks();

      // Calculate KPIs
      const totalContacts = contacts.length;
      const activeLeads = contacts.filter(c => c.leadStatus !== "cold").length;
      const totalRevenue = deals
        .filter(d => d.stage === "closed-won")
        .reduce((sum, deal) => sum + parseFloat(deal.value || "0"), 0);
      
      const convertedLeads = deals.filter(d => d.stage === "closed-won").length;
      const conversionRate = activeLeads > 0 ? (convertedLeads / activeLeads) * 100 : 0;

      // Lead score distribution
      const leadScoreDistribution = {
        hot: contacts.filter(c => (c.leadScore || 0) >= 80).length,
        warm: contacts.filter(c => (c.leadScore || 0) >= 50 && (c.leadScore || 0) < 80).length,
        cold: contacts.filter(c => (c.leadScore || 0) >= 20 && (c.leadScore || 0) < 50).length,
        new: contacts.filter(c => (c.leadScore || 0) < 20).length,
      };

      // Pipeline data
      const pipelineData = {
        prospecting: deals.filter(d => d.stage === "prospecting").length,
        qualified: deals.filter(d => d.stage === "qualified").length,
        proposal: deals.filter(d => d.stage === "proposal").length,
        negotiation: deals.filter(d => d.stage === "negotiation").length,
        closedWon: deals.filter(d => d.stage === "closed-won").length,
      };

      // Recent activities (last 10)
      const recentActivities = activities.slice(0, 10);

      // Top contacts (by lead score)
      const topContacts = contacts
        .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
        .slice(0, 5);

      res.json({
        kpis: {
          totalContacts,
          activeLeads,
          totalRevenue,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
        leadScoreDistribution,
        pipelineData,
        recentActivities,
        topContacts,
        pendingTasks: tasks.filter(t => t.status === "pending").length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Lead management routes
  app.get("/api/leads", async (req, res) => {
    try {
      const { status, score } = req.query;
      let contacts = await storage.getAllContacts();
      
      if (status && typeof status === "string") {
        contacts = contacts.filter(c => c.leadStatus === status);
      }
      
      if (score && typeof score === "string") {
        const minScore = parseInt(score);
        contacts = contacts.filter(c => (c.leadScore || 0) >= minScore);
      }
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Update lead score
  app.patch("/api/contacts/:id/score", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { leadScore, leadStatus } = req.body;
      
      const updateData: any = {};
      if (leadScore !== undefined) updateData.leadScore = leadScore;
      if (leadStatus !== undefined) updateData.leadStatus = leadStatus;
      
      const contact = await storage.updateContact(id, updateData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead score" });
    }
  });

  // Workflow automation routes
  app.post("/api/workflows/lead-scoring", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      let updatedCount = 0;
      
      for (const contact of contacts) {
        let newScore = contact.leadScore || 0;
        let newStatus = contact.leadStatus || "new";
        
        // Simple lead scoring algorithm
        if (contact.company) newScore += 10;
        if (contact.position?.toLowerCase().includes("ceo") || 
            contact.position?.toLowerCase().includes("cto") || 
            contact.position?.toLowerCase().includes("vp")) newScore += 20;
        if (contact.source === "Referral") newScore += 15;
        if (contact.source === "Website") newScore += 10;
        
        // Update status based on score
        if (newScore >= 80) newStatus = "hot";
        else if (newScore >= 50) newStatus = "warm";
        else if (newScore >= 20) newStatus = "cold";
        else newStatus = "new";
        
        if (newScore !== contact.leadScore || newStatus !== contact.leadStatus) {
          await storage.updateContact(contact.id, { leadScore: newScore, leadStatus: newStatus });
          updatedCount++;
        }
      }
      
      res.json({ message: `Updated ${updatedCount} contacts`, updatedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to run lead scoring workflow" });
    }
  });

  // Email automation routes
  app.post("/api/email/send", async (req, res) => {
    try {
      const { contactId, templateId, variables } = req.body;
      
      const contact = await storage.getContact(contactId);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Replace template variables
      let subject = template.subject;
      let body = template.body;
      
      const defaultVariables = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company || "",
        email: contact.email,
        ...variables
      };
      
      Object.entries(defaultVariables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });
      
      // Log activity
      await storage.createActivity({
        contactId: contact.id,
        type: "email",
        title: `Email sent: ${subject}`,
        description: `Sent email using template: ${template.name}`,
      });
      
      // In a real implementation, you would send the actual email here
      res.json({ 
        message: "Email sent successfully", 
        subject, 
        preview: body.substring(0, 100) + "..." 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Task automation
  app.post("/api/tasks/auto-create", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      let tasksCreated = 0;
      
      for (const contact of contacts) {
        const lastContact = contact.lastContactDate;
        const daysSinceContact = lastContact 
          ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Auto-create follow-up tasks for hot leads not contacted in 7 days
        if (contact.leadStatus === "hot" && daysSinceContact > 7) {
          await storage.createTask({
            contactId: contact.id,
            title: `Follow up with ${contact.firstName} ${contact.lastName}`,
            description: `Hot lead not contacted in ${daysSinceContact} days - urgent follow-up needed`,
            priority: "high",
            status: "pending",
            assignedTo: "John Smith",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
          });
          tasksCreated++;
        }
        
        // Auto-create tasks for warm leads not contacted in 14 days
        else if (contact.leadStatus === "warm" && daysSinceContact > 14) {
          await storage.createTask({
            contactId: contact.id,
            title: `Check in with ${contact.firstName} ${contact.lastName}`,
            description: `Warm lead not contacted in ${daysSinceContact} days`,
            priority: "medium",
            status: "pending",
            assignedTo: "John Smith",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
          });
          tasksCreated++;
        }
      }
      
      res.json({ message: `Created ${tasksCreated} follow-up tasks`, tasksCreated });
    } catch (error) {
      res.status(500).json({ message: "Failed to create automated tasks" });
    }
  });

  // Analytics and reporting routes
  app.get("/api/analytics/conversion-funnel", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      const deals = await storage.getAllDeals();
      
      const funnel = {
        totalLeads: contacts.length,
        qualifiedLeads: contacts.filter(c => c.leadStatus !== "new").length,
        proposalStage: deals.filter(d => d.stage === "proposal").length,
        negotiationStage: deals.filter(d => d.stage === "negotiation").length,
        closedWon: deals.filter(d => d.stage === "closed-won").length,
      };
      
      const conversionRates = {
        leadToQualified: funnel.totalLeads > 0 ? (funnel.qualifiedLeads / funnel.totalLeads * 100).toFixed(1) : 0,
        qualifiedToProposal: funnel.qualifiedLeads > 0 ? (funnel.proposalStage / funnel.qualifiedLeads * 100).toFixed(1) : 0,
        proposalToNegotiation: funnel.proposalStage > 0 ? (funnel.negotiationStage / funnel.proposalStage * 100).toFixed(1) : 0,
        negotiationToClose: funnel.negotiationStage > 0 ? (funnel.closedWon / funnel.negotiationStage * 100).toFixed(1) : 0,
      };
      
      res.json({ funnel, conversionRates });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversion funnel data" });
    }
  });

  app.get("/api/analytics/performance", async (req, res) => {
    try {
      const { period = "30" } = req.query;
      const days = parseInt(period as string);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const activities = await storage.getAllActivities();
      const deals = await storage.getAllDeals();
      const tasks = await storage.getAllTasks();
      
      const recentActivities = activities.filter(a => new Date(a.createdAt || 0) >= cutoffDate);
      const recentDeals = deals.filter(d => new Date(d.createdAt || 0) >= cutoffDate);
      const completedTasks = tasks.filter(t => 
        t.status === "completed" && new Date(t.createdAt || 0) >= cutoffDate
      );
      
      const performance = {
        period: `${days} days`,
        activitiesCompleted: recentActivities.length,
        dealsCreated: recentDeals.length,
        tasksCompleted: completedTasks.length,
        averageLeadScore: await calculateAverageLeadScore(),
        activitiesByType: {
          call: recentActivities.filter(a => a.type === "call").length,
          email: recentActivities.filter(a => a.type === "email").length,
          meeting: recentActivities.filter(a => a.type === "meeting").length,
          note: recentActivities.filter(a => a.type === "note").length,
        }
      };
      
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  async function calculateAverageLeadScore(): Promise<number> {
    const contacts = await storage.getAllContacts();
    const totalScore = contacts.reduce((sum, contact) => sum + (contact.leadScore || 0), 0);
    return contacts.length > 0 ? Math.round(totalScore / contacts.length) : 0;
  }

  const httpServer = createServer(app);
  return httpServer;
}
