import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { AdvancedLeadScoring } from "./lead-scoring";
import { CampaignAutomation } from "./campaign-automation";
import { emailService } from "./email-service";
import { calendarService } from "./calendar-service";
import { whatsappService } from "./whatsapp-service";
import { simpleWhatsAppService } from "./whatsapp-simple";
import { insertContactSchema, insertActivitySchema, insertTaskSchema, insertDealSchema, insertEmailTemplateSchema, insertWhatsappTemplateSchema } from "@shared/schema";
import { z } from "zod";

// Team member storage
interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationRole: string;
  isActive: boolean;
  joinedAt: Date;
  invitationId?: number;
  password?: string;
  hasCompletedSetup?: boolean;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  acceptedAt?: Date;
}

const teamStore: TeamMember[] = [
  {
    id: "test-member-1",
    firstName: "Febri",
    lastName: "Test",
    email: "febri@mediawave.co.id",
    role: "user",
    organizationRole: "member",
    isActive: true,
    joinedAt: new Date(),
    password: "test123",
    hasCompletedSetup: true
  }
];
const invitationStore: Invitation[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Team member login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find team member by email
      const teamMember = teamStore.find(member => member.email === email);
      
      if (!teamMember) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if member has completed setup
      if (!teamMember.hasCompletedSetup) {
        return res.status(401).json({ message: "Please complete your account setup first" });
      }
      
      // Verify password (in production, use proper password hashing)
      if (teamMember.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session for team member
      (req.session as any).teamMember = {
        id: teamMember.id,
        email: teamMember.email,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        role: teamMember.role,
        organizationRole: teamMember.organizationRole
      };
      
      res.json({ 
        success: true, 
        user: {
          id: teamMember.id,
          email: teamMember.email,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          role: teamMember.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Protected Contacts routes
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
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
  app.get("/api/activities", isAuthenticated, async (req, res) => {
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

  app.post("/api/activities", isAuthenticated, async (req, res) => {
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
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
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

  // Bulk task operations
  app.patch("/api/tasks/bulk", async (req, res) => {
    try {
      const { ids, updates } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid task IDs" });
      }
      
      const results = [];
      for (const id of ids) {
        try {
          const task = await storage.updateTask(id, updates);
          if (task) results.push(task);
        } catch (error) {
          console.error(`Failed to update task ${id}:`, error);
        }
      }
      
      res.json({ 
        updated: results.length,
        tasks: results 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk update tasks" });
    }
  });

  // Automated follow-up task creation
  app.post("/api/tasks/follow-up", async (req, res) => {
    try {
      const { contactId } = req.body;
      
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Create automated follow-up task
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7); // Follow up in 7 days
      
      const taskData = {
        organizationId: contact.organizationId,
        contactId: contactId,
        title: `Follow-up with ${contact.firstName} ${contact.lastName}`,
        description: `Automated follow-up task created for ${contact.email}`,
        priority: "medium" as const,
        status: "pending" as const,
        dueDate: followUpDate,
        assignedTo: null,
      };
      
      const task = await storage.createTask(taskData);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Follow-up task creation error:", error);
      res.status(500).json({ message: "Failed to create follow-up task" });
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
      console.log('Deal creation request body:', req.body);
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Zod validation error:', error.errors);
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      console.log('Deal creation error:', error);
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
        const stringValue = value ? String(value) : '';
        subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
        body = body.replace(new RegExp(placeholder, 'g'), stringValue);
      });
      
      // Log activity
      await storage.createActivity({
        contactId: contact.id,
        type: "email",
        title: `Email sent: ${subject}`,
        description: `Sent email using template: ${template.name}`,
        organizationId: 1,
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
            organizationId: 1,
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
            organizationId: 1,
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

  // AI Automation routes with caching
  app.post("/api/ai/lead-score/:contactId", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      // Check for cached result first
      const cachedResult = await storage.getCachedAiResult(contactId, "analysis");
      if (cachedResult) {
        return res.json(cachedResult.resultData);
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const activities = await storage.getContactActivities(contactId);
      const deals = await storage.getContactDeals(contactId);
      
      const analysis = await aiService.calculateAILeadScore(contact, activities, deals);
      
      // Cache the result
      await storage.saveAiResult({
        contactId,
        resultType: "analysis",
        resultData: analysis,
        organizationId: 1,
      });

      // Update contact with new AI-calculated score
      await storage.updateContact(contactId, { leadScore: analysis.score });
      
      res.json(analysis);
    } catch (error) {
      console.error("AI lead scoring error:", error);
      res.status(500).json({ message: "AI lead scoring failed" });
    }
  });

  app.post("/api/ai/sentiment-analysis", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const analysis = await aiService.analyzeSentiment(text);
      res.json(analysis);
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      res.status(500).json({ message: "Sentiment analysis failed" });
    }
  });

  // Individual AI lead scoring endpoint
  app.post("/api/ai/lead-score/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const activities = await storage.getContactActivities(contactId);
      const deals = await storage.getContactDeals(contactId);
      
      const analysis = await aiService.calculateAILeadScore(contact, activities, deals);
      
      // Update contact with new AI-generated score
      await storage.updateContact(contactId, { leadScore: analysis.score });
      
      res.json(analysis);
    } catch (error) {
      console.error("AI lead scoring error:", error);
      res.status(500).json({ message: "AI lead scoring failed" });
    }
  });

  app.post("/api/ai/follow-up-recommendations/:contactId", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);

      // Check for cached result first
      const cachedResult = await storage.getCachedAiResult(contactId, "recommendations");
      if (cachedResult) {
        return res.json(cachedResult.resultData);
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const activities = await storage.getContactActivities(contactId);
      const recommendations = await aiService.generateFollowUpRecommendations(contact, activities);

      // Cache the result
      await storage.saveAiResult({
        contactId,
        resultType: "recommendations",
        resultData: recommendations,
        organizationId: 1,
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error("Follow-up recommendations error:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/ai/generate-email", async (req, res) => {
    try {
      const { contactId, type = 'follow-up', context } = req.body;
      
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      // Check for cached result first
      const cachedResult = await storage.getCachedAiResult(contactId, "email", type);
      if (cachedResult) {
        return res.json(cachedResult.resultData);
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const emailContent = await aiService.generateEmailContent(contact, type, context);

      // Cache the result
      await storage.saveAiResult({
        contactId,
        resultType: "email",
        purpose: type,
        resultData: emailContent,
        organizationId: 1,
      });

      res.json(emailContent);
    } catch (error) {
      console.error("Email generation error:", error);
      res.status(500).json({ message: "Failed to generate email" });
    }
  });

  app.post("/api/ai/analyze-deal/:dealId", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const deal = await storage.getAllDeals().then(deals => deals.find(d => d.id === dealId));
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      const contact = await storage.getContact(deal.contactId || 0);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const activities = await storage.getContactActivities(contact.id);
      const analysis = await aiService.analyzeDealProbability(deal, contact, activities);
      
      // Update deal with suggested probability
      await storage.updateDeal(dealId, { probability: analysis.suggestedProbability });
      
      res.json(analysis);
    } catch (error) {
      console.error("Deal analysis error:", error);
      res.status(500).json({ message: "Deal analysis failed" });
    }
  });

  app.post("/api/ai/auto-score-all-leads", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      let processed = 0;
      const results = [];
      
      for (const contact of contacts) {
        try {
          const activities = await storage.getContactActivities(contact.id);
          const deals = await storage.getContactDeals(contact.id);
          
          const analysis = await aiService.calculateAILeadScore(contact, activities, deals);
          await storage.updateContact(contact.id, { leadScore: analysis.score });
          
          results.push({
            contactId: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            oldScore: contact.leadScore,
            newScore: analysis.score,
            reasoning: analysis.reasoning
          });
          processed++;
        } catch (error) {
          console.error(`Failed to process contact ${contact.id}:`, error);
        }
      }
      
      res.json({ 
        message: `AI scoring completed for ${processed} contacts`,
        processed,
        results
      });
    } catch (error) {
      console.error("Bulk AI scoring error:", error);
      res.status(500).json({ message: "Bulk AI scoring failed" });
    }
  });

  // Billing routes
  app.get('/api/billing/current-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.json({ planType: 'free', amount: 0, maxContacts: 100, maxUsers: 3 });
      }

      // Mock subscription data for demo
      const subscription = {
        planType: 'free',
        amount: 0,
        maxContacts: 100,
        maxUsers: 3,
        cancelAtPeriodEnd: false
      };

      res.json(subscription);
    } catch (error) {
      console.error('Error fetching current plan:', error);
      res.status(500).json({ message: 'Failed to fetch current plan' });
    }
  });

  app.get('/api/billing/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.json({ contacts: 0, teamMembers: 1 });
      }

      const contacts = await storage.getAllContacts();
      const orgContacts = contacts.filter(c => c.organizationId === user.organizationId);
      
      const usage = {
        contacts: orgContacts.length,
        teamMembers: 1 // For now, just the current user
      };

      res.json(usage);
    } catch (error) {
      console.error('Error fetching usage:', error);
      res.status(500).json({ message: 'Failed to fetch usage' });
    }
  });

  app.get('/api/billing/invoices', isAuthenticated, async (req: any, res) => {
    try {
      // Mock invoice data for demo
      const invoices = [
        {
          id: 1,
          description: 'Professional Plan - November 2024',
          amount: 49,
          date: new Date('2024-11-01'),
          status: 'paid'
        }
      ];

      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.post('/api/billing/change-plan', isAuthenticated, async (req: any, res) => {
    try {
      const { planId } = req.body;
      
      console.log(`Changing plan to: ${planId}`);
      
      // Plan names mapping
      const planNames = {
        'free': 'Starter',
        'pro': 'Professional', 
        'enterprise': 'Enterprise'
      };
      
      // Add notification for plan change
      const newNotification = {
        id: Date.now().toString(),
        title: 'Plan Updated Successfully',
        message: `Your subscription has been upgraded to ${planNames[planId as keyof typeof planNames]} plan`,
        type: 'success',
        isRead: false,
        createdAt: new Date(),
        relatedTo: {
          type: 'billing',
          id: planId,
          name: `${planNames[planId as keyof typeof planNames]} Plan`
        }
      };
      
      notificationStore.unshift(newNotification);
      
      // Send confirmation email
      try {
        const { emailService } = await import('./email-service.js');
        const user = req.user;
        
        await emailService.sendSingleEmail({
          to: user.claims.email,
          subject: 'Plan Upgrade Confirmation - CRMWIZH',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Plan Upgrade Successful</h2>
              <p>Your CRMWIZH subscription has been successfully upgraded to the <strong>${planNames[planId as keyof typeof planNames]}</strong> plan.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">What's Next?</h3>
                <ul>
                  <li>Access to advanced AI automation features</li>
                  <li>Increased contact and team member limits</li>
                  <li>Priority customer support</li>
                  <li>Advanced analytics and reporting</li>
                </ul>
              </div>
              <p>Login to your dashboard to start using your new features: <a href="${req.protocol}://${req.hostname}">CRMWIZH Dashboard</a></p>
            </div>
          `,
          textContent: `Your CRMWIZH subscription has been upgraded to ${planNames[planId as keyof typeof planNames]} plan. Login to access your new features.`
        });
        
        console.log(`Plan upgrade confirmation email sent to ${user.claims.email}`);
      } catch (emailError) {
        console.error('Failed to send upgrade confirmation email:', emailError);
      }
      
      res.json({ 
        success: true, 
        message: 'Plan changed successfully',
        notification: newNotification
      });
    } catch (error) {
      console.error('Error changing plan:', error);
      res.status(500).json({ message: 'Failed to change plan' });
    }
  });

  app.post('/api/billing/cancel', isAuthenticated, async (req: any, res) => {
    try {
      // Mock cancellation logic
      console.log('Cancelling subscription');
      
      res.json({ success: true, message: 'Subscription cancelled' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Team management routes
  app.get('/api/team/members', isAuthenticated, async (req: any, res) => {
    try {
      // Get all team members including the authenticated user and invited members
      const allMembers = [
        // Current authenticated user (admin/owner)
        {
          id: req.user.claims.sub,
          firstName: req.user.claims.first_name || 'John',
          lastName: req.user.claims.last_name || 'Doe',
          email: req.user.claims.email,
          role: 'user',
          organizationRole: 'owner',
          isActive: true,
          lastLoginAt: new Date()
        },
        // Add all team members from teamStore
        ...teamStore.map(member => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          role: member.role,
          organizationRole: member.organizationRole,
          isActive: member.isActive,
          lastLoginAt: member.joinedAt
        }))
      ];

      res.json(allMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  app.get('/api/team/invitations', isAuthenticated, async (req: any, res) => {
    try {
      res.json(invitationStore);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  });

  app.post('/api/team/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { email, role } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required' });
      }

      // Create new invitation
      const newInvitation = {
        id: Date.now(),
        email,
        role,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date()
      };

      invitationStore.push(newInvitation);
      
      // Send invitation email
      try {
        const inviteLink = `${req.protocol}://${req.hostname}/join-team?token=${newInvitation.id}&email=${encodeURIComponent(email)}`;
        
        // Import email service for sending invitations
        const { emailService } = await import('./email-service.js');
        
        await emailService.sendSingleEmail({
          to: email,
          subject: 'You\'re invited to join CRMWIZH team',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Team Invitation</h2>
              <p>You've been invited to join the CRMWIZH team as a <strong>${role}</strong>.</p>
              <p>Click the button below to accept the invitation and set up your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
          textContent: `You've been invited to join the CRMWIZH team as a ${role}. Visit this link to accept: ${inviteLink}`
        });
        
        console.log(`Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }
      
      res.json({ success: true, message: 'Invitation sent successfully', invitation: newInvitation });
    } catch (error) {
      console.error('Error sending invitation:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  });

  // Accept team invitation endpoint
  app.post('/api/team/accept-invitation', async (req, res) => {
    try {
      const { token, email, password, firstName, lastName } = req.body;
      
      if (!token || !email || !password || !firstName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Find invitation
      const invitation = invitationStore.find(inv => 
        inv.id.toString() === token.toString() && 
        inv.email === email && 
        inv.status === 'pending'
      );
      
      if (!invitation) {
        return res.status(404).json({ message: 'Invalid or expired invitation' });
      }
      
      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: 'Invitation has expired' });
      }
      
      // Update invitation status
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      
      // Create new team member account
      const newMember = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        role: 'user',
        organizationRole: invitation.role,
        isActive: true,
        joinedAt: new Date(),
        invitationId: invitation.id,
        password: password, // Store password for login
        hasCompletedSetup: true
      };
      
      // Add to team store
      teamStore.push(newMember);
      
      console.log(`New team member joined: ${email} as ${invitation.role}`);
      console.log('Current teamStore:', teamStore.map(m => ({ email: m.email, role: m.organizationRole })));
      
      res.json({ 
        success: true, 
        message: 'Invitation accepted successfully',
        member: newMember,
        redirectTo: '/login'
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  });

  app.put('/api/team/members/:memberId/role', isAuthenticated, async (req: any, res) => {
    try {
      const { memberId } = req.params;
      const { role } = req.body;
      
      // Mock role update logic
      console.log(`Updating member ${memberId} role to ${role}`);
      
      res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ message: 'Failed to update member role' });
    }
  });

  app.delete('/api/team/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const { memberId } = req.params;
      
      // Mock member removal logic
      console.log(`Removing member ${memberId}`);
      
      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ message: 'Failed to remove member' });
    }
  });

  app.post('/api/team/invitations/:invitationId/resend', isAuthenticated, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      
      // Mock invitation resend logic
      console.log(`Resending invitation ${invitationId}`);
      
      res.json({ success: true, message: 'Invitation resent successfully' });
    } catch (error) {
      console.error('Error resending invitation:', error);
      res.status(500).json({ message: 'Failed to resend invitation' });
    }
  });

  // Advanced Lead Scoring & Automation API
  app.post('/api/automation/score-lead/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      const activities = await storage.getContactActivities(contactId);
      const deals = await storage.getContactDeals(contactId);
      
      const scoringResult = AdvancedLeadScoring.calculateLeadScore(contact, activities, deals);
      
      // Update contact with new score
      await storage.updateContact(contactId, { leadScore: scoringResult.score });
      
      // Process automation triggers
      for (const trigger of scoringResult.triggers) {
        console.log(`Automation trigger: ${trigger.type} - ${trigger.content}`);
      }
      
      res.json({
        score: scoringResult.score,
        reasoning: scoringResult.reasoning,
        recommendations: scoringResult.recommendations,
        automationTriggered: scoringResult.triggers.length,
        triggers: scoringResult.triggers
      });
    } catch (error) {
      console.error('Lead scoring error:', error);
      res.status(500).json({ message: 'Lead scoring failed' });
    }
  });

  // Bulk Lead Scoring for all contacts
  app.post('/api/automation/bulk-score-leads', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getAllContacts();
      let processed = 0;
      let automationTriggered = 0;
      
      for (const contact of contacts) {
        const activities = await storage.getContactActivities(contact.id);
        const deals = await storage.getContactDeals(contact.id);
        
        const scoringResult = AdvancedLeadScoring.calculateLeadScore(contact, activities, deals);
        
        // Update contact score
        await storage.updateContact(contact.id, { leadScore: scoringResult.score });
        
        if (scoringResult.triggers.length > 0) {
          automationTriggered++;
        }
        
        processed++;
      }
      
      res.json({
        processed,
        automationTriggered,
        message: `Successfully processed ${processed} contacts with ${automationTriggered} automation triggers`
      });
    } catch (error) {
      console.error('Bulk scoring error:', error);
      res.status(500).json({ message: 'Bulk scoring failed' });
    }
  });

  // Campaign Automation Endpoints
  app.get('/api/campaigns/sequences', isAuthenticated, async (req: any, res) => {
    try {
      const sequences = CampaignAutomation.getDefaultSequences();
      res.json(sequences);
    } catch (error) {
      console.error('Error fetching campaign sequences:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/campaigns/trigger/:sequenceId', isAuthenticated, async (req: any, res) => {
    try {
      const { sequenceId } = req.params;
      const { contactId } = req.body;
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      const sequences = CampaignAutomation.getDefaultSequences();
      const sequence = sequences.find(s => s.id === sequenceId);
      
      if (!sequence) {
        return res.status(404).json({ message: 'Campaign sequence not found' });
      }
      
      // Trigger first step of sequence
      if (sequence.steps.length > 0) {
        await CampaignAutomation.executeCampaignStep(sequence.steps[0], contact, sequence);
      }
      
      res.json({
        success: true,
        message: `Campaign ${sequence.name} triggered for ${contact.firstName} ${contact.lastName}`,
        sequenceId,
        contactId,
        nextSteps: sequence.steps.length - 1
      });
    } catch (error) {
      console.error('Campaign trigger error:', error);
      res.status(500).json({ message: 'Campaign trigger failed' });
    }
  });

  // Lifecycle Automation - Auto-assign leads based on score
  app.post('/api/automation/lifecycle-rules', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getAllContacts();
      let mqlCount = 0;
      let sqlCount = 0;
      let hotLeadCount = 0;
      
      for (const contact of contacts) {
        const activities = await storage.getContactActivities(contact.id);
        const deals = await storage.getContactDeals(contact.id);
        
        const scoringResult = AdvancedLeadScoring.calculateLeadScore(contact, activities, deals);
        
        // Lifecycle automation rules
        let newStatus = contact.leadStatus;
        
        if (scoringResult.score >= 80) {
          newStatus = 'hot';
          hotLeadCount++;
          
          // Auto-assign to senior sales rep
          await storage.createTask({
            title: `HOT LEAD: Contact ${contact.firstName} ${contact.lastName} immediately`,
            description: `Lead score: ${scoringResult.score}/100. ${scoringResult.reasoning}`,
            contactId: contact.id,
            organizationId: contact.organizationId,
            priority: 'high',
            status: 'pending',
            assignedTo: 'senior-sales-rep',
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            createdBy: 'system'
          });
          
        } else if (scoringResult.score >= 55) {
          newStatus = 'qualified';
          sqlCount++;
          
          // Create follow-up task
          await storage.createTask({
            title: `Follow up with qualified lead: ${contact.firstName} ${contact.lastName}`,
            description: `MQL to SQL conversion opportunity. Score: ${scoringResult.score}/100`,
            contactId: contact.id,
            organizationId: contact.organizationId,
            priority: 'medium',
            status: 'pending',
            assignedTo: 'sales-rep',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdBy: 'system'
          });
          
        } else if (scoringResult.score >= 40) {
          newStatus = 'marketing-qualified';
          mqlCount++;
        }
        
        // Update contact status if changed
        if (newStatus !== contact.leadStatus) {
          await storage.updateContact(contact.id, { 
            leadStatus: newStatus,
            leadScore: scoringResult.score
          });
        }
      }
      
      res.json({
        processed: contacts.length,
        mqlGenerated: mqlCount,
        sqlGenerated: sqlCount,
        hotLeadsGenerated: hotLeadCount,
        automationRulesApplied: true,
        message: 'Lifecycle automation rules processed successfully'
      });
    } catch (error) {
      console.error('Lifecycle automation error:', error);
      res.status(500).json({ message: 'Lifecycle automation failed' });
    }
  });

  // Churn Prediction & Win-Back System
  app.get('/api/automation/churn-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getAllContacts();
      const activities = await storage.getAllActivities();
      const deals = await storage.getAllDeals();
      
      const churnRisks = [];
      const winBackOpportunities = [];
      
      for (const contact of contacts) {
        const contactActivities = activities.filter(a => a.contactId === contact.id);
        const contactDeals = deals.filter(d => d.contactId === contact.id);
        
        // Calculate days since last activity
        const lastActivity = contactActivities.length > 0 ? 
          Math.max(...contactActivities.map(a => new Date(a.createdAt || 0).getTime())) : 0;
        const daysSinceLastActivity = lastActivity > 0 ? 
          (Date.now() - lastActivity) / (1000 * 60 * 60 * 24) : 999;
        
        // Churn risk scoring
        let churnScore = 0;
        
        if (daysSinceLastActivity > 90) churnScore += 40;
        else if (daysSinceLastActivity > 60) churnScore += 30;
        else if (daysSinceLastActivity > 30) churnScore += 20;
        
        if (contactDeals.length === 0) churnScore += 20;
        if ((contact.leadScore || 0) < 30) churnScore += 20;
        if (contactActivities.length < 3) churnScore += 20;
        
        if (churnScore >= 60) {
          churnRisks.push({
            contactId: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            company: contact.company,
            churnScore,
            daysSinceLastActivity: Math.round(daysSinceLastActivity),
            riskLevel: churnScore >= 80 ? 'high' : 'medium',
            recommendations: [
              'Immediate personal outreach required',
              'Offer special discount or loyalty incentive',
              'Schedule win-back call',
              'Send reengagement campaign'
            ]
          });
        }
        
        // Win-back opportunities (previously churned but showing signs of interest)
        if (daysSinceLastActivity <= 7 && (contact.leadScore || 0) >= 40 && contactDeals.length > 0) {
          winBackOpportunities.push({
            contactId: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            company: contact.company,
            reengagementScore: contact.leadScore,
            lastActivity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
            potentialValue: contactDeals.reduce((sum, deal) => sum + parseFloat(deal.value || '0'), 0)
          });
        }
      }
      
      res.json({
        churnAnalysis: {
          totalContacts: contacts.length,
          atRiskContacts: churnRisks.length,
          churnRiskPercentage: ((churnRisks.length / contacts.length) * 100).toFixed(1),
          churnRisks: churnRisks.slice(0, 10), // Top 10 risks
          winBackOpportunities: winBackOpportunities.slice(0, 10) // Top 10 opportunities
        },
        recommendations: [
          'Implement automated re-engagement campaigns',
          'Create win-back offer sequences',
          'Set up churn prediction alerts',
          'Establish customer success check-ins'
        ]
      });
    } catch (error) {
      console.error('Churn analysis error:', error);
      res.status(500).json({ message: 'Churn analysis failed' });
    }
  });

  // NPS & Feedback Loop System
  app.get('/api/automation/nps-dashboard', isAuthenticated, async (req: any, res) => {
    try {
      // Mock NPS data based on contact engagement
      const contacts = await storage.getAllContacts();
      const activities = await storage.getAllActivities();
      
      let promoters = 0;
      let passives = 0;
      let detractors = 0;
      
      const npsData = contacts.map(contact => {
        const contactActivities = activities.filter(a => a.contactId === contact.id);
        const engagementScore = Math.min(100, (contactActivities.length * 10) + (contact.leadScore || 0));
        
        let npsScore;
        if (engagementScore >= 80) {
          npsScore = Math.floor(Math.random() * 3) + 8; // 8-10 (Promoters)
          promoters++;
        } else if (engagementScore >= 50) {
          npsScore = Math.floor(Math.random() * 2) + 7; // 7-8 (Passives)
          passives++;
        } else {
          npsScore = Math.floor(Math.random() * 7); // 0-6 (Detractors)
          detractors++;
        }
        
        return {
          contactId: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          company: contact.company,
          npsScore,
          category: npsScore >= 9 ? 'promoter' : npsScore >= 7 ? 'passive' : 'detractor',
          feedback: npsScore >= 9 ? 'Excellent service and support!' : 
                   npsScore >= 7 ? 'Good experience overall' : 
                   'Could use improvement in response time'
        };
      });
      
      const totalResponses = contacts.length;
      const npsCalculation = totalResponses > 0 ? 
        Math.round(((promoters - detractors) / totalResponses) * 100) : 0;
      
      res.json({
        npsScore: npsCalculation,
        totalResponses,
        breakdown: {
          promoters: { count: promoters, percentage: ((promoters / totalResponses) * 100).toFixed(1) },
          passives: { count: passives, percentage: ((passives / totalResponses) * 100).toFixed(1) },
          detractors: { count: detractors, percentage: ((detractors / totalResponses) * 100).toFixed(1) }
        },
        recentFeedback: npsData.slice(0, 10),
        insights: [
          npsCalculation >= 50 ? 'Excellent NPS score - customers are highly satisfied' :
          npsCalculation >= 0 ? 'Good NPS score with room for improvement' :
          'NPS needs attention - focus on customer satisfaction',
          'Automated follow-up triggered for detractors',
          'Promoters identified for referral program',
          'Feedback sentiment analysis completed'
        ]
      });
    } catch (error) {
      console.error('NPS dashboard error:', error);
      res.status(500).json({ message: 'NPS dashboard failed' });
    }
  });

  // Reports & Analytics API
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const { dateRange = "30", reportType = "overview" } = req.query;
      
      // Get all data for calculations
      const contacts = await storage.getAllContacts();
      const activities = await storage.getAllActivities();
      const deals = await storage.getAllDeals();
      const tasks = await storage.getAllTasks();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));
      
      // Filter data by date range
      const filteredActivities = activities.filter(activity => 
        activity.createdAt && new Date(activity.createdAt) >= startDate
      );
      const filteredDeals = deals.filter(deal => 
        deal.createdAt && new Date(deal.createdAt) >= startDate
      );
      
      // Calculate sales metrics
      const wonDeals = filteredDeals.filter(deal => deal.stage === 'won');
      const lostDeals = filteredDeals.filter(deal => deal.stage === 'lost');
      const totalRevenue = wonDeals.reduce((sum, deal) => sum + (parseFloat(deal.value || '0') || 0), 0);
      const averageDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
      const conversionRate = filteredDeals.length > 0 ? (wonDeals.length / filteredDeals.length) * 100 : 0;
      
      // Calculate lead metrics
      const qualifiedLeads = contacts.filter(contact => contact.leadStatus === 'qualified');
      const hotLeads = contacts.filter(contact => contact.leadScore && contact.leadScore >= 80);
      
      // Lead sources analysis
      const sourceCount: Record<string, number> = {};
      contacts.forEach(contact => {
        const source = contact.source || 'Unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      
      const leadSources = Object.entries(sourceCount).map(([source, count]) => ({
        source,
        count,
        percentage: parseFloat(((count / contacts.length) * 100).toFixed(1))
      }));
      
      // Activity metrics
      const emailActivities = filteredActivities.filter(activity => activity.type === 'email');
      const callActivities = filteredActivities.filter(activity => activity.type === 'call');
      const meetingActivities = filteredActivities.filter(activity => activity.type === 'meeting');
      
      // Time series data (weekly breakdown)
      const timeSeriesData = [];
      const weeksInRange = Math.ceil(parseInt(dateRange) / 7);
      
      for (let i = 0; i < weeksInRange; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekDeals = filteredDeals.filter(deal => {
          const dealDate = new Date(deal.createdAt || '');
          return dealDate >= weekStart && dealDate <= weekEnd;
        });
        
        const weekContacts = contacts.filter(contact => {
          const contactDate = new Date(contact.createdAt || '');
          return contactDate >= weekStart && contactDate <= weekEnd;
        });
        
        const weekRevenue = weekDeals
          .filter(deal => deal.stage === 'won')
          .reduce((sum, deal) => sum + (parseFloat(deal.value || '0') || 0), 0);
        
        timeSeriesData.push({
          date: `Week ${i + 1}`,
          revenue: weekRevenue,
          leads: weekContacts.length,
          deals: weekDeals.length
        });
      }
      
      // Conversion funnel
      const totalLeads = contacts.length;
      const opportunityDeals = deals.filter(deal => deal.stage !== 'won' && deal.stage !== 'lost');
      const proposalDeals = deals.filter(deal => deal.stage === 'proposal');
      
      const conversionFunnel = [
        { stage: "Leads Generated", count: totalLeads, conversionRate: 100 },
        { stage: "Qualified Leads", count: qualifiedLeads.length, conversionRate: totalLeads > 0 ? (qualifiedLeads.length / totalLeads) * 100 : 0 },
        { stage: "Opportunities", count: opportunityDeals.length, conversionRate: totalLeads > 0 ? (opportunityDeals.length / totalLeads) * 100 : 0 },
        { stage: "Proposals Sent", count: proposalDeals.length, conversionRate: totalLeads > 0 ? (proposalDeals.length / totalLeads) * 100 : 0 },
        { stage: "Deals Won", count: wonDeals.length, conversionRate: totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0 }
      ];
      
      // Calculate sales cycle (average days from creation to close)
      const closedDeals = filteredDeals.filter(deal => deal.actualCloseDate);
      const salesCycle = closedDeals.length > 0 ? 
        closedDeals.reduce((sum, deal) => {
          const created = new Date(deal.createdAt || '');
          const closed = new Date(deal.actualCloseDate || '');
          return sum + Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / closedDeals.length : 0;
      
      res.json({
        salesMetrics: {
          totalRevenue,
          dealsWon: wonDeals.length,
          dealsLost: lostDeals.length,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageDealSize: Math.round(averageDealSize),
          salesCycle: Math.round(salesCycle)
        },
        leadMetrics: {
          totalLeads: contacts.length,
          qualifiedLeads: qualifiedLeads.length,
          hotLeads: hotLeads.length,
          leadSources
        },
        activityMetrics: {
          totalActivities: filteredActivities.length,
          emailsSent: emailActivities.length,
          callsMade: callActivities.length,
          meetingsScheduled: meetingActivities.length
        },
        timeSeriesData,
        conversionFunnel
      });
    } catch (error) {
      console.error('Reports API error:', error);
      res.status(500).json({ message: 'Failed to generate reports' });
    }
  });

  // Email Management Routes
  app.post('/api/email/send-follow-up', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId, customMessage } = req.body;
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const success = await emailService.sendFollowUpEmail(contact, customMessage);
      
      if (success) {
        // Log the email activity
        await storage.createActivity({
          contactId,
          type: "email",
          title: "Follow-up email sent",
          description: `Automated follow-up email sent to ${contact.email}`,
          date: new Date(),
          organizationId: contact.organizationId,
          createdBy: req.user.claims.sub
        });
        
        res.json({ success: true, message: "Follow-up email sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send email" });
      }
    } catch (error) {
      console.error('Error sending follow-up email:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  app.post('/api/email/send-welcome', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId } = req.body;
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const success = await emailService.sendWelcomeEmail(contact);
      
      if (success) {
        await storage.createActivity({
          contactId,
          type: "email",
          title: "Welcome email sent",
          description: `Welcome email sent to ${contact.email}`,
          date: new Date(),
          organizationId: contact.organizationId,
          createdBy: req.user.claims.sub
        });
        
        res.json({ success: true, message: "Welcome email sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send email" });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  app.post('/api/email/send-bulk-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const { contactIds, subject, htmlContent, textContent } = req.body;
      
      const contacts = await Promise.all(
        contactIds.map((id: number) => storage.getContact(id))
      );
      
      const validContacts = contacts.filter(contact => contact !== undefined);
      
      if (validContacts.length === 0) {
        return res.status(400).json({ message: "No valid contacts found" });
      }

      const result = await emailService.sendBulkCampaign({
        contacts: validContacts,
        subject,
        htmlContent,
        textContent
      });
      
      // Log activities for sent emails
      for (const contact of validContacts) {
        await storage.createActivity({
          contactId: contact.id,
          type: "email",
          title: "Campaign email sent",
          description: `Campaign email sent: ${subject}`,
          date: new Date(),
          organizationId: contact.organizationId,
          createdBy: req.user.claims.sub
        });
      }
      
      res.json({
        success: true,
        message: `Campaign sent to ${result.sent} contacts`,
        details: result
      });
    } catch (error) {
      console.error('Error sending bulk campaign:', error);
      res.status(500).json({ message: 'Failed to send campaign' });
    }
  });

  app.get('/api/email/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = emailService.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  // Calendar Management Routes
  app.post('/api/calendar/schedule-meeting', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId, proposedTimes, meetingType, duration, description } = req.body;
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const result = await calendarService.scheduleFollowUpMeeting({
        contactId,
        contact,
        proposedTimes: proposedTimes.map((time: string) => new Date(time)),
        meetingType: meetingType || 'follow-up',
        duration,
        description,
        createdBy: req.user.claims.sub
      });
      
      if (result.success) {
        // Log the meeting activity
        await storage.createActivity({
          contactId,
          type: "meeting",
          title: `${meetingType || 'Follow-up'} meeting scheduled`,
          description: description || `Meeting scheduled with ${contact.firstName} ${contact.lastName}`,
          date: new Date(),
          organizationId: contact.organizationId,
          createdBy: req.user.claims.sub
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      res.status(500).json({ message: 'Failed to schedule meeting' });
    }
  });

  app.get('/api/calendar/available-slots', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, duration } = req.query;
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const meetingDuration = duration ? parseInt(duration as string) : 30;
      
      const slots = await calendarService.getAvailableTimeSlots(start, end, meetingDuration);
      res.json(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ message: 'Failed to fetch available slots' });
    }
  });

  app.get('/api/calendar/upcoming-meetings', isAuthenticated, async (req, res) => {
    try {
      const { days } = req.query;
      const daysAhead = days ? parseInt(days as string) : 7;
      
      const meetings = await calendarService.getUpcomingMeetings(daysAhead);
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
      res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  app.post('/api/calendar/send-reminder/:eventId', isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const success = await calendarService.sendMeetingReminder(eventId);
      
      if (success) {
        res.json({ success: true, message: "Reminder sent successfully" });
      } else {
        res.status(400).json({ success: false, message: "Failed to send reminder" });
      }
    } catch (error) {
      console.error('Error sending meeting reminder:', error);
      res.status(500).json({ message: 'Failed to send reminder' });
    }
  });

  app.patch('/api/calendar/meeting/:eventId/status', isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      
      const success = await calendarService.updateMeetingStatus(eventId, status);
      
      if (success) {
        res.json({ success: true, message: "Meeting status updated" });
      } else {
        res.status(404).json({ success: false, message: "Meeting not found" });
      }
    } catch (error) {
      console.error('Error updating meeting status:', error);
      res.status(500).json({ message: 'Failed to update meeting status' });
    }
  });

  app.post('/api/calendar/auto-schedule-follow-up', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId, urgency } = req.body;
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const eventId = await calendarService.autoScheduleFollowUp(contact, urgency || 'medium');
      
      if (eventId) {
        await storage.createActivity({
          contactId,
          type: "meeting",
          title: "Auto-scheduled follow-up",
          description: `Automatically scheduled follow-up meeting based on ${urgency} priority`,
          date: new Date(),
          organizationId: contact.organizationId,
          createdBy: req.user.claims.sub
        });
        
        res.json({ 
          success: true, 
          eventId, 
          message: "Follow-up meeting auto-scheduled successfully" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "No available slots for auto-scheduling" 
        });
      }
    } catch (error) {
      console.error('Error auto-scheduling follow-up:', error);
      res.status(500).json({ message: 'Failed to auto-schedule follow-up' });
    }
  });

  // In-memory notification storage for persistent state
  let notificationStore = [
    {
      id: '1',
      title: 'New Lead Score Update',
      message: 'Hadrian Febri lead score increased to 131 points',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      relatedTo: {
        type: 'contact',
        id: '3',
        name: 'Hadrian Febri'
      }
    },
    {
      id: '2',
      title: 'Email Campaign Sent',
      message: 'Bulk email campaign sent to 1 contact successfully',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      relatedTo: {
        type: 'email',
        id: 'campaign_1',
        name: 'Welcome Campaign'
      }
    },
    {
      id: '3',
      title: 'Meeting Scheduled',
      message: 'Follow-up meeting auto-scheduled with Hadrian Febri',
      type: 'success',
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      relatedTo: {
        type: 'meeting',
        id: 'meeting_1',
        name: 'Follow-up Call'
      }
    }
  ];

  // Notification Management Routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      res.json(notificationStore);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Find and update notification
      const notification = notificationStore.find(n => n.id === id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      notification.isRead = true;
      console.log(`Notification ${id} marked as read`);
      
      res.json({ success: true, message: 'Notification marked as read', notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      // Mark all notifications as read
      notificationStore.forEach(notification => {
        notification.isRead = true;
      });
      
      console.log('All notifications marked as read');
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  // Add new notification (for testing realtime updates)
  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const { title, message, type = 'info', relatedTo } = req.body;
      
      const newNotification = {
        id: Date.now().toString(),
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date(),
        relatedTo
      };
      
      notificationStore.unshift(newNotification); // Add to beginning
      
      // Keep only last 50 notifications
      if (notificationStore.length > 50) {
        notificationStore = notificationStore.slice(0, 50);
      }
      
      res.json({ success: true, notification: newNotification });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  // Bulk Lead Actions
  app.post('/api/leads/bulk-action', isAuthenticated, async (req: any, res) => {
    try {
      const { action, leadIds, data } = req.body;
      console.log('Bulk action request:', { action, leadIds, data });

      if (!action || !leadIds || !Array.isArray(leadIds)) {
        return res.status(400).json({ message: 'Invalid bulk action request' });
      }

      let processed = 0;

      for (const leadId of leadIds) {
        try {
          switch (action) {
            case 'update-status':
              if (data.leadStatus) {
                await storage.updateContact(leadId, { leadStatus: data.leadStatus });
                processed++;
              }
              break;
            
            case 'score':
              const contactForScore = await storage.getContact(leadId);
              if (contactForScore) {
                const newScore = Math.min((contactForScore.leadScore || 0) + (data.leadScore || 10), 100);
                await storage.updateContact(leadId, { leadScore: newScore });
                processed++;
              }
              break;
            
            case 'email':
              const contactForEmail = await storage.getContact(leadId);
              if (contactForEmail && contactForEmail.email) {
                try {
                  const success = await emailService.sendFollowUpEmail(contactForEmail, 
                    data.customMessage || "Thank you for your interest in our services. We'd love to discuss how we can help your business grow."
                  );
                  if (success) {
                    processed++;
                    // Log activity
                    await storage.createActivity({
                      contactId: leadId,
                      organizationId: contactForEmail.organizationId,
                      type: 'email',
                      title: 'Bulk follow-up email sent',
                      description: 'Bulk follow-up email sent via leads management',
                      date: new Date(),
                      createdBy: req.user.claims.sub
                    });
                  }
                } catch (error) {
                  console.error(`Failed to send email to lead ${leadId}:`, error);
                }
              }
              break;
            
            case 'schedule':
              const contactForSchedule = await storage.getContact(leadId);
              if (contactForSchedule) {
                try {
                  // Create a follow-up task
                  await storage.createTask({
                    title: `Follow-up with ${contactForSchedule.firstName} ${contactForSchedule.lastName}`,
                    description: `Schedule follow-up meeting or call with ${contactForSchedule.company || 'this lead'}`,
                    contactId: leadId,
                    organizationId: contactForSchedule.organizationId,
                    priority: data.priority || 'medium',
                    status: 'pending',
                    assignedTo: req.user.claims.sub,
                    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    createdBy: req.user.claims.sub
                  });
                  processed++;
                } catch (error) {
                  console.error(`Failed to create task for lead ${leadId}:`, error);
                }
              }
              break;
            
            default:
              console.log(`Unknown bulk action: ${action}`);
          }
        } catch (error) {
          console.error(`Error processing bulk action for lead ${leadId}:`, error);
        }
      }

      res.json({ 
        success: true, 
        processed,
        message: `Successfully processed ${processed} leads`
      });
    } catch (error) {
      console.error('Error executing bulk action:', error);
      res.status(500).json({ message: 'Failed to execute bulk action' });
    }
  });

  // Simple WhatsApp routes (no API key needed - uses wa.me links)
  app.get('/api/whatsapp/simple/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = simpleWhatsAppService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Simple WhatsApp templates error:', error);
      res.status(500).json({ message: 'Failed to get templates' });
    }
  });

  app.post('/api/whatsapp/simple/generate-link', isAuthenticated, async (req, res) => {
    try {
      const { contactId, templateId, variables } = req.body;
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      if (!contact.phone) {
        return res.status(400).json({ message: 'Contact has no phone number' });
      }

      let result;
      
      if (templateId === 'order_confirm_simple') {
        result = simpleWhatsAppService.generateOrderConfirmation(contact, variables);
      } else if (templateId === 'payment_reminder_simple') {
        result = simpleWhatsAppService.generatePaymentReminder(contact, variables);
      } else if (templateId === 'followup_simple') {
        result = simpleWhatsAppService.generateFollowUp(contact, variables.reviewLink);
      } else if (templateId === 'promo_broadcast') {
        result = simpleWhatsAppService.generatePromoBroadcast(contact, variables);
      } else {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      // Log activity
      await storage.createActivity({
        contactId: contact.id,
        type: 'whatsapp',
        title: 'WhatsApp Link Generated',
        description: `wa.me link created for ${templateId}`,
        organizationId: contact.organizationId,
      });

      res.json({ 
        success: true, 
        waLink: result.waLink,
        message: result.message,
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName}`,
        phone: contact.phone,
        instruction: 'Klik link wa.me untuk buka WhatsApp dan kirim pesan'
      });
    } catch (error) {
      console.error('Simple WhatsApp link generation error:', error);
      res.status(500).json({ message: 'Failed to generate WhatsApp link' });
    }
  });

  app.post('/api/whatsapp/simple/bulk-links', isAuthenticated, async (req, res) => {
    try {
      const { contactIds, message, templateId, variables } = req.body;
      
      if (!contactIds || contactIds.length === 0) {
        return res.status(400).json({ message: 'No contacts selected' });
      }

      const contacts = await Promise.all(
        contactIds.map((id: number) => storage.getContact(id))
      );

      const validContacts = contacts.filter(contact => 
        contact && contact.phone
      );

      let links;
      if (templateId && variables) {
        // Generate from template
        links = validContacts.map(contact => {
          let result;
          if (templateId === 'promo_broadcast') {
            result = simpleWhatsAppService.generatePromoBroadcast(contact, variables);
          } else if (templateId === 'followup_simple') {
            result = simpleWhatsAppService.generateFollowUp(contact, variables.reviewLink);
          } else {
            // Custom message
            const waLink = simpleWhatsAppService.generateWhatsAppLink(contact.phone!, message);
            result = { waLink, message };
          }
          
          return {
            contactId: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            phone: contact.phone,
            waLink: result.waLink,
            message: result.message
          };
        });
      } else {
        // Simple message broadcast
        links = simpleWhatsAppService.generateBulkWhatsAppLinks(validContacts, message);
      }

      // Log activities
      for (const contact of validContacts) {
        await storage.createActivity({
          contactId: contact.id,
          type: 'whatsapp',
          title: 'Bulk WhatsApp Link',
          description: `Bulk wa.me link generated: ${message ? message.substring(0, 50) : 'template message'}...`,
          organizationId: contact.organizationId,
        });
      }

      res.json({ 
        success: true, 
        links,
        instruction: 'Buka setiap link wa.me untuk kirim pesan ke customer',
        totalLinks: links.length
      });
    } catch (error) {
      console.error('Bulk WhatsApp links error:', error);
      res.status(500).json({ message: 'Failed to generate bulk links' });
    }
  });

  app.get('/api/whatsapp/simple/instructions', isAuthenticated, async (req, res) => {
    try {
      const instructions = simpleWhatsAppService.getUsageInstructions();
      res.json({ instructions });
    } catch (error) {
      console.error('WhatsApp instructions error:', error);
      res.status(500).json({ message: 'Failed to get instructions' });
    }
  });

  // WhatsApp Template CRUD routes
  app.get('/api/whatsapp/templates/custom', isAuthenticated, async (req, res) => {
    try {
      let templates = await storage.getAllWhatsappTemplates();
      
      // Seed default templates if none exist
      if (templates.length === 0) {
        const defaultTemplates = [
          {
            name: 'Konfirmasi Pesanan',
            content: `Halo {{nama_customer}}! 👋

Terima kasih sudah order di {{nama_toko}}!

📦 *Detail Pesanan:*
Order ID: {{order_id}}
Item: {{item_list}}
Total: Rp {{total_harga}}

📅 Estimasi kirim: {{estimasi_kirim}}
📍 Alamat: {{alamat}}

💳 *Pembayaran:*
Transfer ke: {{rekening_bank}}
a.n {{nama_toko}}

Konfirmasi pembayaran kirim bukti transfer ya!
Terima kasih! 🙏`,
            category: 'order_confirmation',
            description: 'Template konfirmasi pesanan untuk toko online UMKM',
            isActive: true,
            organizationId: 1,
            createdBy: 'system',
          },
          {
            name: 'Reminder Pembayaran',
            content: `Halo {{nama_customer}}! 😊

Ini reminder untuk pesanan Anda:

📦 Order ID: {{order_id}}
💰 Total: Rp {{total_harga}}

⏰ Batas waktu pembayaran: {{batas_waktu}}

💳 Transfer ke:
{{rekening_bank}}
a.n {{nama_toko}}

Kalau sudah transfer, kirim bukti ya!
Terima kasih! 🙏`,
            category: 'payment_reminder',
            description: 'Mengingatkan customer untuk melakukan pembayaran',
            isActive: true,
            organizationId: 1,
            createdBy: 'system',
          },
          {
            name: 'Follow-up Kepuasan',
            content: `Halo {{nama_customer}}! 😊

Gimana produknya? Sudah sampai dengan baik kan?

Kalau puas sama produk dan pelayanan kami, boleh bantu kasih review bintang 5 di:
{{link_review}}

Review dari customer seperti Anda sangat membantu toko kami berkembang!

Ada kritik atau saran? Boleh sharing juga ya!

Terima kasih banyak! ⭐⭐⭐⭐⭐`,
            category: 'follow_up',
            description: 'Follow-up kepuasan customer setelah menerima produk',
            isActive: true,
            organizationId: 1,
            createdBy: 'system',
          },
          {
            name: 'Broadcast Promo',
            content: `🎉 *PROMO SPESIAL {{nama_toko}}!* 🎉

{{judul_promo}}

💰 Diskon: {{diskon}}
⏰ Berlaku: {{periode_promo}}
🛍️ Min. pembelian: Rp {{min_beli}}

🎁 *Cara Order:*
1. Chat WhatsApp ini
2. Sebutkan kode: {{kode_promo}}
3. Pilih produk favorit

Jangan sampai kehabisan ya! Stock terbatas!

Lihat katalog lengkap: {{link_catalog}}

#PromoSpesial #{{nama_toko}}`,
            category: 'promotion',
            description: 'Template broadcast promo untuk menarik customer',
            isActive: true,
            organizationId: 1,
            createdBy: 'system',
          }
        ];

        // Create default templates
        for (const template of defaultTemplates) {
          await storage.createWhatsappTemplate(template);
        }
        
        // Fetch templates again after seeding
        templates = await storage.getAllWhatsappTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error('Get WhatsApp templates error:', error);
      res.status(500).json({ message: 'Failed to get WhatsApp templates' });
    }
  });

  app.get('/api/whatsapp/templates/custom/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getWhatsappTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Get WhatsApp template error:', error);
      res.status(500).json({ message: 'Failed to get WhatsApp template' });
    }
  });

  app.post('/api/whatsapp/templates/custom', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertWhatsappTemplateSchema.parse(req.body);
      
      const template = await storage.createWhatsappTemplate({
        ...validatedData,
        createdBy: req.user?.claims?.sub || 'unknown',
        organizationId: 1,
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid template data', errors: error.errors });
      }
      console.error('Create WhatsApp template error:', error);
      res.status(500).json({ message: 'Failed to create WhatsApp template' });
    }
  });

  app.put('/api/whatsapp/templates/custom/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWhatsappTemplateSchema.partial().parse(req.body);
      
      const template = await storage.updateWhatsappTemplate(id, validatedData);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid template data', errors: error.errors });
      }
      console.error('Update WhatsApp template error:', error);
      res.status(500).json({ message: 'Failed to update WhatsApp template' });
    }
  });

  app.delete('/api/whatsapp/templates/custom/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWhatsappTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Delete WhatsApp template error:', error);
      res.status(500).json({ message: 'Failed to delete WhatsApp template' });
    }
  });

  // WhatsApp Business API routes (advanced - requires API key)
  app.get('/api/whatsapp/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('WhatsApp templates error:', error);
      res.status(500).json({ message: 'Failed to get WhatsApp templates' });
    }
  });

  app.post('/api/whatsapp/send-message', isAuthenticated, async (req, res) => {
    try {
      const { contactId, message, type = 'text', templateName, templateParams } = req.body;
      
      if (!contactId || !message) {
        return res.status(400).json({ message: 'Contact ID and message are required' });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      if (!contact.phone) {
        return res.status(400).json({ message: 'Contact has no phone number' });
      }

      let result;
      if (type === 'template' && templateName) {
        result = await whatsappService.sendTemplateMessage(
          contact.phone,
          templateName,
          templateParams || {},
          contact.id
        );
      } else {
        result = await whatsappService.sendTextMessage(
          contact.phone,
          message,
          contact.id
        );
      }

      // Log as activity
      await storage.createActivity({
        contactId: contact.id,
        type: 'whatsapp',
        title: 'WhatsApp Message',
        description: `WhatsApp message sent: ${message.substring(0, 50)}...`,
        organizationId: contact.organizationId,
      });

      res.json({ success: true, message: 'WhatsApp message sent', data: result });
    } catch (error) {
      console.error('WhatsApp send error:', error);
      res.status(500).json({ message: 'Failed to send WhatsApp message' });
    }
  });

  app.post('/api/whatsapp/send-order-confirmation', isAuthenticated, async (req, res) => {
    try {
      const { contactId, orderDetails } = req.body;
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      const result = await whatsappService.sendOrderConfirmation(contact, orderDetails);

      await storage.createActivity({
        contactId: contact.id,
        type: 'whatsapp',
        title: 'Order Confirmation',
        description: `Order confirmation sent for order ${orderDetails.orderNumber}`,
        organizationId: contact.organizationId,
      });

      res.json({ success: true, message: 'Order confirmation sent', data: result });
    } catch (error) {
      console.error('WhatsApp order confirmation error:', error);
      res.status(500).json({ message: 'Failed to send order confirmation' });
    }
  });

  app.post('/api/whatsapp/send-payment-reminder', isAuthenticated, async (req, res) => {
    try {
      const { contactId, orderDetails } = req.body;
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      const result = await whatsappService.sendPaymentReminder(contact, orderDetails);

      await storage.createActivity({
        contactId: contact.id,
        type: 'whatsapp',
        title: 'Payment Reminder',
        description: `Payment reminder sent for order ${orderDetails.orderNumber}`,
        organizationId: contact.organizationId,
      });

      res.json({ success: true, message: 'Payment reminder sent', data: result });
    } catch (error) {
      console.error('WhatsApp payment reminder error:', error);
      res.status(500).json({ message: 'Failed to send payment reminder' });
    }
  });

  app.post('/api/whatsapp/send-follow-up', isAuthenticated, async (req, res) => {
    try {
      const { contactId, purchaseDate } = req.body;
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      const result = await whatsappService.sendFollowUp(contact, purchaseDate);

      await storage.createActivity({
        contactId: contact.id,
        type: 'whatsapp',
        title: 'Follow-up Message',
        description: `Follow-up message sent for purchase on ${purchaseDate}`,
        organizationId: contact.organizationId,
      });

      res.json({ success: true, message: 'Follow-up message sent', data: result });
    } catch (error) {
      console.error('WhatsApp follow-up error:', error);
      res.status(500).json({ message: 'Failed to send follow-up message' });
    }
  });

  app.post('/api/whatsapp/broadcast', isAuthenticated, async (req, res) => {
    try {
      const { contactIds, message, templateName, templateParams } = req.body;
      
      if (!contactIds || contactIds.length === 0) {
        return res.status(400).json({ message: 'Contact IDs are required' });
      }

      const contacts = [];
      for (const contactId of contactIds) {
        const contact = await storage.getContact(contactId);
        if (contact && contact.phone) {
          contacts.push(contact);
        }
      }

      if (contacts.length === 0) {
        return res.status(400).json({ message: 'No valid contacts with phone numbers found' });
      }

      const results = await whatsappService.broadcastMessage(
        contacts,
        message,
        templateName,
        templateParams
      );

      // Log activities for each contact
      for (const result of results) {
        if (result.contactId) {
          await storage.createActivity({
            contactId: result.contactId,
            type: 'whatsapp',
            title: 'Broadcast Message',
            description: `Broadcast message: ${message.substring(0, 50)}...`,
            organizationId: 1,
          });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      res.json({ 
        success: true, 
        message: `Broadcast completed. ${successCount} sent, ${failedCount} failed.`,
        results: {
          total: results.length,
          sent: successCount,
          failed: failedCount
        }
      });
    } catch (error) {
      console.error('WhatsApp broadcast error:', error);
      res.status(500).json({ message: 'Failed to send broadcast' });
    }
  });

  app.get('/api/whatsapp/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = whatsappService.getDefaultTemplates();
      res.json(templates);
    } catch (error) {
      console.error('WhatsApp templates error:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  // WhatsApp webhook for receiving messages and status updates
  app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && whatsappService.verifyWebhook(token as string)) {
      console.log('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  });

  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      await whatsappService.processWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('WhatsApp webhook processing error:', error);
      res.status(500).send('Error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
