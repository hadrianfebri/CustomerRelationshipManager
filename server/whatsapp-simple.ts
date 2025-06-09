import type { Contact } from '@shared/schema';

// Simple WhatsApp integration for UMKM using wa.me links and browser automation
export interface SimpleWhatsAppMessage {
  phone: string;
  message: string;
  autoSend?: boolean;
}

export interface WhatsAppWebIntegration {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'order' | 'payment' | 'followup' | 'promo';
}

class SimpleWhatsAppService {
  // Pre-made templates untuk UMKM Indonesia
  private templates: WhatsAppWebIntegration[] = [
    {
      id: 'order_confirm_simple',
      name: 'Konfirmasi Pesanan Sederhana',
      description: 'Template konfirmasi pesanan untuk toko online',
      template: `Halo {{nama_customer}}! 👋

Terima kasih sudah order di {{nama_toko}}!

📦 *Detail Pesanan:*
Order ID: {{order_id}}
Item: {{item_list}}
Total: {{total_harga}}

📅 Estimasi kirim: {{estimasi_kirim}}
📍 Alamat: {{alamat}}

Pembayaran bisa transfer ke:
BCA: 1234567890 a.n {{nama_toko}}

Konfirmasi pembayaran kirim bukti transfer ya! 

Terima kasih! 🙏`,
      variables: ['nama_customer', 'nama_toko', 'order_id', 'item_list', 'total_harga', 'estimasi_kirim', 'alamat'],
      category: 'order'
    },
    {
      id: 'payment_reminder_simple',
      name: 'Reminder Pembayaran',
      description: 'Mengingatkan customer untuk bayar',
      template: `Halo {{nama_customer}}! 😊

Ini reminder untuk pesanan:
Order ID: {{order_id}}
Total: {{total_harga}}

Jangan lupa transfer ya ke:
{{rekening_bank}}

Batas waktu: {{batas_waktu}}

Kalau sudah transfer, kirim bukti ya! 
Terima kasih! 🙏`,
      variables: ['nama_customer', 'order_id', 'total_harga', 'rekening_bank', 'batas_waktu'],
      category: 'payment'
    },
    {
      id: 'followup_simple',
      name: 'Follow-up Kepuasan',
      description: 'Tanya kepuasan customer setelah terima barang',
      template: `Halo {{nama_customer}}! 😊

Gimana barangnya? Sudah sampai dengan baik kan?

Kalau puas sama produk dan pelayanan kami, boleh kasih review bintang 5 di:
{{link_review}}

Review dari customer sangat membantu toko kami berkembang! 

Terima kasih banyak! ⭐⭐⭐⭐⭐`,
      variables: ['nama_customer', 'link_review'],
      category: 'followup'
    },
    {
      id: 'promo_broadcast',
      name: 'Broadcast Promo',
      description: 'Template untuk broadcast promo atau info terbaru',
      template: `🎉 *PROMO SPESIAL* {{nama_toko}}! 🎉

{{judul_promo}}

💰 Diskon: {{diskon}}
⏰ Berlaku: {{periode_promo}}
🛍️ Min. pembelian: {{min_beli}}

Cara order:
1. Chat WhatsApp ini
2. Sebutkan kode: {{kode_promo}}
3. Pilih produk favorit

Jangan sampai kehabisan ya! Stock terbatas! 

{{link_catalog}}`,
      variables: ['nama_toko', 'judul_promo', 'diskon', 'periode_promo', 'min_beli', 'kode_promo', 'link_catalog'],
      category: 'promo'
    }
  ];

  // Generate wa.me link for easy messaging
  generateWhatsAppLink(phone: string, message: string): string {
    // Clean phone number (remove +, spaces, dashes)
    const cleanPhone = phone.replace(/[\+\s\-\(\)]/g, '');
    
    // Add Indonesia country code if not present
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
      formattedPhone = '62' + cleanPhone;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  // Generate message from template with variables
  generateMessageFromTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let message = template.template;
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`;
      message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    return message;
  }

  // Get all available templates
  getTemplates(): WhatsAppWebIntegration[] {
    return this.templates;
  }

  // Generate quick message for order confirmation
  generateOrderConfirmation(contact: Contact, orderData: {
    orderId: string;
    items: string;
    total: string;
    shopName: string;
    estimatedDelivery?: string;
    bankAccount?: string;
  }): { message: string; waLink: string } {
    const variables = {
      nama_customer: `${contact.firstName} ${contact.lastName}`,
      nama_toko: orderData.shopName,
      order_id: orderData.orderId,
      item_list: orderData.items,
      total_harga: orderData.total,
      estimasi_kirim: orderData.estimatedDelivery || '2-3 hari kerja',
      alamat: 'Sesuai yang diberikan'
    };

    const message = this.generateMessageFromTemplate('order_confirm_simple', variables);
    const waLink = this.generateWhatsAppLink(contact.phone!, message);

    return { message, waLink };
  }

  // Generate payment reminder
  generatePaymentReminder(contact: Contact, paymentData: {
    orderId: string;
    amount: string;
    bankAccount: string;
    dueDate: string;
  }): { message: string; waLink: string } {
    const variables = {
      nama_customer: `${contact.firstName} ${contact.lastName}`,
      order_id: paymentData.orderId,
      total_harga: paymentData.amount,
      rekening_bank: paymentData.bankAccount,
      batas_waktu: paymentData.dueDate
    };

    const message = this.generateMessageFromTemplate('payment_reminder_simple', variables);
    const waLink = this.generateWhatsAppLink(contact.phone!, message);

    return { message, waLink };
  }

  // Generate follow-up message
  generateFollowUp(contact: Contact, reviewLink?: string): { message: string; waLink: string } {
    const variables = {
      nama_customer: `${contact.firstName} ${contact.lastName}`,
      link_review: reviewLink || 'Google/Tokopedia/Shopee'
    };

    const message = this.generateMessageFromTemplate('followup_simple', variables);
    const waLink = this.generateWhatsAppLink(contact.phone!, message);

    return { message, waLink };
  }

  // Generate broadcast promo
  generatePromoBroadcast(contact: Contact, promoData: {
    shopName: string;
    promoTitle: string;
    discount: string;
    period: string;
    minPurchase: string;
    promoCode: string;
    catalogLink?: string;
  }): { message: string; waLink: string } {
    const variables = {
      nama_toko: promoData.shopName,
      judul_promo: promoData.promoTitle,
      diskon: promoData.discount,
      periode_promo: promoData.period,
      min_beli: promoData.minPurchase,
      kode_promo: promoData.promoCode,
      link_catalog: promoData.catalogLink || 'Chat untuk lihat katalog'
    };

    const message = this.generateMessageFromTemplate('promo_broadcast', variables);
    const waLink = this.generateWhatsAppLink(contact.phone!, message);

    return { message, waLink };
  }

  // Bulk generate wa.me links for broadcast
  generateBulkWhatsAppLinks(contacts: Contact[], message: string): Array<{
    contactId: number;
    name: string;
    phone: string;
    waLink: string;
  }> {
    return contacts
      .filter(contact => contact.phone)
      .map(contact => ({
        contactId: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        phone: contact.phone!,
        waLink: this.generateWhatsAppLink(contact.phone!, message)
      }));
  }

  // Instructions for UMKM how to use
  getUsageInstructions(): string {
    return `
## Cara Mudah Pakai WhatsApp untuk UMKM

### 1. Tanpa API Key - Pakai Browser
- Klik link wa.me yang dibuat sistem
- Otomatis buka WhatsApp Web/App
- Pesan sudah siap, tinggal klik Send

### 2. Untuk Broadcast ke Banyak Customer
- Pilih template promo/broadcast
- Sistem buat link terpisah untuk setiap customer
- Buka link satu-satu, atau pakai browser extension

### 3. Tips Efisien
- Save template sering dipakai
- Pakai Chrome extension "Multiple tabs"
- Set keyboard shortcut untuk send message

### 4. Tracking Manual
- Screenshot confirmation sent
- Update status di CRM setelah kirim
- Catat response customer

**Mudah kan? Tidak perlu ribet setup API!**
    `;
  }
}

export const simpleWhatsAppService = new SimpleWhatsAppService();