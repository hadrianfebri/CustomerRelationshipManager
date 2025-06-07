import { 
  contacts, activities, tasks, deals, emailTemplates, users,
  type Contact, type InsertContact,
  type Activity, type InsertActivity,
  type Task, type InsertTask,
  type Deal, type InsertDeal,
  type EmailTemplate, type InsertEmailTemplate,
  type User, type InsertUser
} from "@shared/schema";

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
    // Initialize with some basic email templates
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
      leadStatus: insertContact.leadStatus || "new"
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
      createdAt: new Date()
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
      priority: insertTask.priority || "medium"
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
      probability: insertDeal.probability || 50
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
      isActive: insertTemplate.isActive !== false
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

export const storage = new MemStorage();
