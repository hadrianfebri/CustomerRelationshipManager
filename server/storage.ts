import { 
  contacts, activities, tasks, deals, emailTemplates, users,
  type Contact, type InsertContact,
  type Activity, type InsertActivity,
  type Task, type InsertTask,
  type Deal, type InsertDeal,
  type EmailTemplate, type InsertEmailTemplate,
  type User, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getAllContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;

  // Activities
  getAllActivities(): Promise<Activity[]>;
  getContactActivities(contactId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Tasks
  getAllTasks(): Promise<Task[]>;
  getContactTasks(contactId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Deals
  getAllDeals(): Promise<Deal[]>;
  getContactDeals(contactId: number): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;

  // Email Templates
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private activities: Map<number, Activity>;
  private tasks: Map<number, Task>;
  private deals: Map<number, Deal>;
  private emailTemplates: Map<number, EmailTemplate>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.activities = new Map();
    this.tasks = new Map();
    this.deals = new Map();
    this.emailTemplates = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with some sample data for demonstration
    const sampleContacts: Omit<Contact, "id">[] = [
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@techstart.com",
        phone: "+1 (555) 123-4567",
        company: "TechStart Solutions",
        position: "CEO",
        leadScore: 85,
        leadStatus: "hot",
        source: "Website",
        notes: "Interested in enterprise package",
        tags: ["enterprise", "decision-maker"],
        lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "m.chen@digitalinnovations.com",
        phone: "+1 (555) 987-6543",
        company: "Digital Innovations Inc",
        position: "CTO",
        leadScore: 70,
        leadStatus: "warm",
        source: "Referral",
        notes: "Looking for integration solutions",
        tags: ["technical", "integration"],
        lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        firstName: "Emma",
        lastName: "Rodriguez",
        email: "emma.r@globalenterprise.com",
        phone: "+1 (555) 456-7890",
        company: "Global Enterprise Corp",
        position: "VP Sales",
        leadScore: 45,
        leadStatus: "cold",
        source: "Cold Call",
        notes: "Budget constraints, follow up Q2",
        tags: ["budget-sensitive"],
        lastContactDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      }
    ];

    // Initialize contacts
    sampleContacts.forEach(contact => {
      const id = this.currentId++;
      this.contacts.set(id, { ...contact, id });
    });

    // Initialize activities
    const sampleActivities: Omit<Activity, "id">[] = [
      {
        contactId: 1,
        type: "call",
        title: "Discovery call",
        description: "Initial needs assessment and product demo",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        contactId: 1,
        type: "email",
        title: "Proposal sent",
        description: "Sent enterprise package proposal with pricing",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        contactId: 2,
        type: "meeting",
        title: "Technical requirements review",
        description: "Discussed integration capabilities and API access",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleActivities.forEach(activity => {
      const id = this.currentId++;
      this.activities.set(id, { ...activity, id });
    });

    // Initialize tasks
    const sampleTasks: Omit<Task, "id">[] = [
      {
        contactId: 1,
        title: "Follow up on proposal",
        description: "Check if Sarah has reviewed the enterprise proposal",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: "high",
        status: "pending",
        assignedTo: "John Smith",
        createdAt: new Date(),
      },
      {
        contactId: 2,
        title: "Prepare technical demo",
        description: "Set up API integration demo for Michael",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: "medium",
        status: "pending",
        assignedTo: "John Smith",
        createdAt: new Date(),
      },
      {
        contactId: null,
        title: "Update CRM documentation",
        description: "Add new features to user documentation",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: "low",
        status: "pending",
        assignedTo: "John Smith",
        createdAt: new Date(),
      }
    ];

    sampleTasks.forEach(task => {
      const id = this.currentId++;
      this.tasks.set(id, { ...task, id });
    });

    // Initialize deals
    const sampleDeals: Omit<Deal, "id">[] = [
      {
        contactId: 1,
        title: "TechStart Enterprise Package",
        value: "75000.00",
        stage: "proposal",
        probability: 75,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        actualCloseDate: null,
        notes: "High priority prospect, good budget fit",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        contactId: 2,
        title: "Digital Innovations Integration",
        value: "45000.00",
        stage: "qualified",
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        actualCloseDate: null,
        notes: "Technical evaluation in progress",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleDeals.forEach(deal => {
      const id = this.currentId++;
      this.deals.set(id, { ...deal, id });
    });

    // Initialize email templates
    const templates: Omit<EmailTemplate, "id">[] = [
      {
        name: "Welcome Email",
        subject: "Welcome to our platform!",
        body: "Hi {{firstName}},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team",
        category: "welcome",
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: "Follow-up",
        subject: "Following up on our conversation",
        body: "Hi {{firstName}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\nLet me know if you have any questions.\n\nBest regards,\n{{senderName}}",
        category: "follow-up",
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: "Proposal Template",
        subject: "Your {{company}} Proposal - {{proposalTitle}}",
        body: "Dear {{firstName}},\n\nThank you for your interest in our services. Please find attached your customized proposal for {{company}}.\n\nProposal Details:\n- Solution: {{solutionName}}\n- Investment: {{proposalAmount}}\n- Timeline: {{timeline}}\n\nI'm available to discuss any questions you may have.\n\nBest regards,\n{{senderName}}\n{{senderTitle}}",
        category: "proposal",
        isActive: true,
        createdAt: new Date(),
      }
    ];

    templates.forEach(template => {
      const id = this.currentId++;
      this.emailTemplates.set(id, { ...template, id });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contacts
  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentId++;
    const contact: Contact = { 
      ...insertContact, 
      id, 
      createdAt: new Date(),
      leadScore: insertContact.leadScore || 0,
      leadStatus: insertContact.leadStatus || "new",
      source: insertContact.source || null,
      phone: insertContact.phone || null,
      company: insertContact.company || null,
      position: insertContact.position || null,
      notes: insertContact.notes || null,
      tags: insertContact.tags || [],
      lastContactDate: insertContact.lastContactDate || null
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...contactUpdate };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.contacts.values()).filter(contact =>
      contact.firstName.toLowerCase().includes(lowercaseQuery) ||
      contact.lastName.toLowerCase().includes(lowercaseQuery) ||
      contact.email.toLowerCase().includes(lowercaseQuery) ||
      (contact.company && contact.company.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }

  async getContactActivities(contactId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.contactId === contactId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId++;
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      date: insertActivity.date || new Date(),
      createdAt: new Date(),
      contactId: insertActivity.contactId || null,
      description: insertActivity.description || null
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Tasks
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getContactTasks(contactId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      status: insertTask.status || "pending",
      priority: insertTask.priority || "medium",
      contactId: insertTask.contactId || null,
      description: insertTask.description || null,
      dueDate: insertTask.dueDate || null,
      assignedTo: insertTask.assignedTo || null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Deals
  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getContactDeals(contactId: number): Promise<Deal[]> {
    return Array.from(this.deals.values())
      .filter(deal => deal.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.currentId++;
    const deal: Deal = { 
      ...insertDeal, 
      id, 
      createdAt: new Date(),
      stage: insertDeal.stage || "prospecting",
      probability: insertDeal.probability || 50,
      value: insertDeal.value || null,
      notes: insertDeal.notes || null,
      contactId: insertDeal.contactId || null,
      expectedCloseDate: insertDeal.expectedCloseDate || null,
      actualCloseDate: insertDeal.actualCloseDate || null
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: number, dealUpdate: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal = { ...deal, ...dealUpdate };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  // Email Templates
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentId++;
    const template: EmailTemplate = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date(),
      isActive: insertTemplate.isActive !== false,
      category: insertTemplate.category || null
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateUpdate };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Contacts
  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(contacts.id);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values({
        ...insertContact,
        createdAt: new Date(),
      })
      .returning();
    return contact;
  }

  async updateContact(id: number, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(contactUpdate)
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(
        or(
          like(contacts.firstName, `%${query}%`),
          like(contacts.lastName, `%${query}%`),
          like(contacts.email, `%${query}%`),
          like(contacts.company, `%${query}%`)
        )
      );
  }

  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.createdAt);
  }

  async getContactActivities(contactId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.contactId, contactId))
      .orderBy(activities.createdAt);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        createdAt: new Date(),
      })
      .returning();
    return activity;
  }

  // Tasks
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.createdAt);
  }

  async getContactTasks(contactId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.contactId, contactId))
      .orderBy(tasks.createdAt);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        createdAt: new Date(),
      })
      .returning();
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Deals
  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(deals.createdAt);
  }

  async getContactDeals(contactId: number): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(eq(deals.contactId, contactId))
      .orderBy(deals.createdAt);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values({
        ...insertDeal,
        createdAt: new Date(),
      })
      .returning();
    return deal;
  }

  async updateDeal(id: number, dealUpdate: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set(dealUpdate)
      .where(eq(deals.id, id))
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Email Templates
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.createdAt);
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db
      .insert(emailTemplates)
      .values({
        ...insertTemplate,
        createdAt: new Date(),
      })
      .returning();
    return template;
  }

  async updateEmailTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .update(emailTemplates)
      .set(templateUpdate)
      .where(eq(emailTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
