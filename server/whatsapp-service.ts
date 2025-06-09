import { Contact } from "@shared/schema";

export interface WhatsAppMessage {
  id: string;
  contactId: number;
  phoneNumber: string;
  message: string;
  type: 'text' | 'template' | 'media';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  templateName?: string;
  templateParams?: Record<string, string>;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components: WhatsAppComponent[];
}

export interface WhatsAppComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'media' | 'location';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: WhatsAppButton[];
}

export interface WhatsAppButton {
  type: 'quick_reply' | 'url' | 'phone_number';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  targetContacts: number[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  createdAt: Date;
  sentAt?: Date;
}

class WhatsAppService {
  private apiUrl = 'https://graph.facebook.com/v18.0';
  private accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  constructor() {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp Business API credentials not configured');
    }
  }

  // Send text message
  async sendTextMessage(
    phoneNumber: string, 
    message: string, 
    contactId?: number
  ): Promise<WhatsAppMessage> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
      
      const messageData = {
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      const whatsappMessage: WhatsAppMessage = {
        id: result.messages?.[0]?.id || Date.now().toString(),
        contactId: contactId || 0,
        phoneNumber: cleanPhoneNumber,
        message,
        type: 'text',
        status: response.ok ? 'sent' : 'failed',
        sentAt: new Date(),
        errorMessage: response.ok ? undefined : result.error?.message,
      };

      return whatsappMessage;
    } catch (error) {
      console.error('WhatsApp send message error:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  // Send template message
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, string> = {},
    contactId?: number
  ): Promise<WhatsAppMessage> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
      
      // Convert parameters to WhatsApp format
      const components = [];
      const paramValues = Object.values(parameters);
      
      if (paramValues.length > 0) {
        components.push({
          type: 'body',
          parameters: paramValues.map(value => ({
            type: 'text',
            text: value
          }))
        });
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'id' // Indonesian
          },
          components: components.length > 0 ? components : undefined
        }
      };

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      const whatsappMessage: WhatsAppMessage = {
        id: result.messages?.[0]?.id || Date.now().toString(),
        contactId: contactId || 0,
        phoneNumber: cleanPhoneNumber,
        message: `Template: ${templateName}`,
        type: 'template',
        status: response.ok ? 'sent' : 'failed',
        templateName,
        templateParams: parameters,
        sentAt: new Date(),
        errorMessage: response.ok ? undefined : result.error?.message,
      };

      return whatsappMessage;
    } catch (error) {
      console.error('WhatsApp send template error:', error);
      throw new Error('Failed to send WhatsApp template');
    }
  }

  // Send order confirmation
  async sendOrderConfirmation(contact: Contact, orderDetails: {
    orderNumber: string;
    items: string;
    total: string;
    deliveryDate?: string;
  }): Promise<WhatsAppMessage> {
    const message = `🛍️ *Konfirmasi Pesanan*

Halo ${contact.firstName}!

Terima kasih atas pesanan Anda:
📋 *No. Pesanan:* ${orderDetails.orderNumber}
🛒 *Items:* ${orderDetails.items}
💰 *Total:* ${orderDetails.total}
${orderDetails.deliveryDate ? `🚚 *Estimasi Kirim:* ${orderDetails.deliveryDate}` : ''}

Kami akan segera memproses pesanan Anda. Jika ada pertanyaan, silakan balas pesan ini.

Terima kasih! 🙏`;

    return this.sendTextMessage(contact.phone || '', message, contact.id);
  }

  // Send payment reminder
  async sendPaymentReminder(contact: Contact, orderDetails: {
    orderNumber: string;
    amount: string;
    dueDate: string;
    paymentLink?: string;
  }): Promise<WhatsAppMessage> {
    const message = `💳 *Reminder Pembayaran*

Halo ${contact.firstName},

Pesanan Anda menunggu pembayaran:
📋 *No. Pesanan:* ${orderDetails.orderNumber}
💰 *Jumlah:* ${orderDetails.amount}
⏰ *Jatuh Tempo:* ${orderDetails.dueDate}

${orderDetails.paymentLink ? `💻 *Link Pembayaran:* ${orderDetails.paymentLink}` : ''}

Mohon lakukan pembayaran sebelum jatuh tempo. Hubungi kami jika ada kendala.

Terima kasih! 🙏`;

    return this.sendTextMessage(contact.phone || '', message, contact.id);
  }

  // Send follow-up message
  async sendFollowUp(contact: Contact, purchaseDate: string): Promise<WhatsAppMessage> {
    const message = `⭐ *Bagaimana Pengalaman Anda?*

Halo ${contact.firstName}!

Sudah beberapa hari sejak pembelian Anda pada ${purchaseDate}. 

Kami ingin tahu:
• Apakah produk sudah diterima dengan baik? ✅
• Bagaimana kualitas produknya? ⭐
• Ada masukan untuk kami? 💬

Review Anda sangat berharga untuk perbaikan layanan kami.

Balas pesan ini atau rating kami di:
⭐⭐⭐⭐⭐

Terima kasih! 🙏`;

    return this.sendTextMessage(contact.phone || '', message, contact.id);
  }

  // Send promotional message
  async sendPromotion(contact: Contact, promo: {
    title: string;
    description: string;
    discount: string;
    validUntil: string;
    code?: string;
  }): Promise<WhatsAppMessage> {
    const message = `🎉 *${promo.title}*

Halo ${contact.firstName}!

${promo.description}

🎁 *Diskon:* ${promo.discount}
⏰ *Berlaku sampai:* ${promo.validUntil}
${promo.code ? `🔑 *Kode Promo:* ${promo.code}` : ''}

Jangan sampai terlewat! Hubungi kami sekarang untuk order.

*Syarat dan ketentuan berlaku

Salam hangat! 🛍️`;

    return this.sendTextMessage(contact.phone || '', message, contact.id);
  }

  // Broadcast message to multiple contacts
  async broadcastMessage(
    contacts: Contact[],
    message: string,
    templateName?: string,
    templateParams?: Record<string, string>
  ): Promise<WhatsAppMessage[]> {
    const results: WhatsAppMessage[] = [];
    
    for (const contact of contacts) {
      try {
        let result: WhatsAppMessage;
        
        if (templateName) {
          result = await this.sendTemplateMessage(
            contact.phone || '',
            templateName,
            templateParams,
            contact.id
          );
        } else {
          result = await this.sendTextMessage(
            contact.phone || '',
            message,
            contact.id
          );
        }
        
        results.push(result);
        
        // Rate limiting - wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send to ${contact.phone}:`, error);
        results.push({
          id: Date.now().toString(),
          contactId: contact.id,
          phoneNumber: contact.phone || '',
          message,
          type: templateName ? 'template' : 'text',
          status: 'failed',
          sentAt: new Date(),
          errorMessage: 'Broadcast failed',
        });
      }
    }
    
    return results;
  }

  // Clean phone number to international format
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Indonesian numbers
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  // Verify webhook token
  verifyWebhook(token: string): boolean {
    return token === this.verifyToken;
  }

  // Process incoming webhook
  async processWebhook(webhookData: any): Promise<void> {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          await this.handleIncomingMessage(message, value.contacts?.[0]);
        }
      }

      if (value?.statuses) {
        for (const status of value.statuses) {
          await this.handleMessageStatus(status);
        }
      }
    } catch (error) {
      console.error('WhatsApp webhook processing error:', error);
    }
  }

  private async handleIncomingMessage(message: any, contact: any): Promise<void> {
    console.log('Incoming WhatsApp message:', {
      from: message.from,
      type: message.type,
      text: message.text?.body,
      timestamp: message.timestamp,
    });

    // Here you can integrate with your CRM to:
    // 1. Find or create contact
    // 2. Log the message as an activity
    // 3. Trigger automated responses
    // 4. Update lead scoring
  }

  private async handleMessageStatus(status: any): Promise<void> {
    console.log('WhatsApp message status update:', {
      id: status.id,
      status: status.status,
      timestamp: status.timestamp,
    });

    // Update message status in your database
  }

  // Get default templates for UMKM
  getDefaultTemplates(): WhatsAppTemplate[] {
    return [
      {
        id: 'order_confirmation',
        name: 'order_confirmation',
        category: 'utility',
        language: 'id',
        status: 'approved',
        components: [
          {
            type: 'body',
            text: 'Halo {{1}}, pesanan Anda {{2}} senilai {{3}} telah dikonfirmasi. Terima kasih!',
            example: {
              body_text: [['John', 'ABC123', 'Rp 150.000']]
            }
          }
        ]
      },
      {
        id: 'payment_reminder',
        name: 'payment_reminder',
        category: 'utility',
        language: 'id',
        status: 'approved',
        components: [
          {
            type: 'body',
            text: 'Halo {{1}}, pesanan {{2}} menunggu pembayaran Rp {{3}}. Jatuh tempo: {{4}}.',
            example: {
              body_text: [['John', 'ABC123', '150.000', '20 Jan 2024']]
            }
          }
        ]
      },
      {
        id: 'promo_blast',
        name: 'promo_blast',
        category: 'marketing',
        language: 'id',
        status: 'approved',
        components: [
          {
            type: 'body',
            text: 'Hai {{1}}! Ada promo spesial untuk Anda: {{2}}. Diskon {{3}} berlaku sampai {{4}}!',
            example: {
              body_text: [['John', 'Flash Sale', '50%', '31 Jan 2024']]
            }
          }
        ]
      }
    ];
  }
}

export const whatsappService = new WhatsAppService();