import { MailService } from '@sendgrid/mail';
import type { Contact } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  contacts: Contact[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

export interface EmailActivityLog {
  id: string;
  contactId: number;
  campaignId?: string;
  templateId?: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
}

class EmailService {
  private fromEmail = 'noreply@yourcrm.com'; // Replace with your verified sender
  private fromName = 'Your CRM System';

  async sendSingleEmail(params: {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateVariables?: Record<string, string>;
  }): Promise<boolean> {
    try {
      let processedHtml = params.htmlContent;
      let processedSubject = params.subject;
      
      // Replace template variables
      if (params.templateVariables) {
        Object.entries(params.templateVariables).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      await mailService.send({
        to: {
          email: params.to,
          name: params.toName || ''
        },
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: processedSubject,
        html: processedHtml,
        text: params.textContent || this.stripHtml(processedHtml),
      });

      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendFollowUpEmail(contact: Contact, customMessage?: string): Promise<boolean> {
    const templateVariables = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company || 'your company',
      position: contact.position || 'your role',
    };

    const subject = `Following up with you, ${contact.firstName}`;
    
    const htmlContent = customMessage || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{firstName}},</h2>
        
        <p>I hope this email finds you well. I wanted to follow up on our previous conversation and see how things are progressing at {{company}}.</p>
        
        <p>As someone in {{position}}, I believe our solution could help streamline your operations and drive better results for your team.</p>
        
        <p>Would you be available for a brief call this week to discuss how we can help {{company}} achieve its goals?</p>
        
        <p>Best regards,<br>
        <strong>${this.fromName}</strong></p>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            This email was sent from your CRM system. If you no longer wish to receive emails, please reply with "UNSUBSCRIBE".
          </p>
        </div>
      </div>
    `;

    return await this.sendSingleEmail({
      to: contact.email,
      toName: `${contact.firstName} ${contact.lastName}`,
      subject,
      htmlContent,
      templateVariables
    });
  }

  async sendWelcomeEmail(contact: Contact): Promise<boolean> {
    const templateVariables = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company || 'your organization',
    };

    const subject = `Welcome ${contact.firstName}! Let's get started`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 0;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Our Community!</h1>
          <p style="font-size: 18px; color: #666;">Hi {{firstName}}, thanks for joining us</p>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 12px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">What's Next?</h2>
          <ul style="line-height: 1.8; color: #555;">
            <li>📞 <strong>Schedule a discovery call</strong> - Let's understand {{company}}'s needs</li>
            <li>📧 <strong>Check your inbox</strong> - We'll send helpful resources and tips</li>
            <li>🎯 <strong>Explore our solutions</strong> - See how we can help your business grow</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule Your Call</a>
        </div>
        
        <p style="color: #666;">If you have any questions, feel free to reply to this email. We're here to help!</p>
        
        <p>Best regards,<br>
        <strong>The ${this.fromName} Team</strong></p>
      </div>
    `;

    return await this.sendSingleEmail({
      to: contact.email,
      toName: `${contact.firstName} ${contact.lastName}`,
      subject,
      htmlContent,
      templateVariables
    });
  }

  async sendBulkCampaign(campaign: {
    contacts: Contact[];
    subject: string;
    htmlContent: string;
    textContent?: string;
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const contact of campaign.contacts) {
      const templateVariables = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        company: contact.company || '',
        position: contact.position || '',
      };

      const success = await this.sendSingleEmail({
        to: contact.email,
        toName: `${contact.firstName} ${contact.lastName}`,
        subject: campaign.subject,
        htmlContent: campaign.htmlContent,
        textContent: campaign.textContent,
        templateVariables
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Email templates for different scenarios
  getEmailTemplates(): EmailTemplate[] {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome {{firstName}}! Let\'s get started',
        variables: ['firstName', 'lastName', 'company'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome {{firstName}}!</h1>
            <p>Thanks for joining us at {{company}}. We're excited to work with you.</p>
          </div>
        `,
        textContent: 'Welcome {{firstName}}! Thanks for joining us at {{company}}.'
      },
      {
        id: 'follow-up',
        name: 'Follow-up Email',
        subject: 'Following up with you, {{firstName}}',
        variables: ['firstName', 'lastName', 'company', 'position'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello {{firstName}},</h2>
            <p>I wanted to follow up on our conversation about {{company}}.</p>
            <p>Best regards</p>
          </div>
        `,
        textContent: 'Hello {{firstName}}, I wanted to follow up on our conversation about {{company}}.'
      },
      {
        id: 'meeting-reminder',
        name: 'Meeting Reminder',
        subject: 'Reminder: Our meeting tomorrow',
        variables: ['firstName', 'meetingTime', 'meetingDate'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Meeting Reminder</h2>
            <p>Hi {{firstName}},</p>
            <p>This is a reminder about our meeting scheduled for {{meetingDate}} at {{meetingTime}}.</p>
          </div>
        `,
        textContent: 'Hi {{firstName}}, reminder about our meeting on {{meetingDate}} at {{meetingTime}}.'
      }
    ];
  }
}

export const emailService = new EmailService();