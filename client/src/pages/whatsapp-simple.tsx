import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, ExternalLink, Copy, Phone, ShoppingCart, CreditCard, Star, Megaphone, CheckCircle, Info } from "lucide-react";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  status: string;
}

interface SimpleWhatsAppTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'order' | 'payment' | 'followup' | 'promo';
}

interface WhatsAppLink {
  contactId: number;
  name: string;
  phone: string;
  waLink: string;
  message: string;
}

export default function WhatsAppSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<WhatsAppLink[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Form states for different templates
  const [orderForm, setOrderForm] = useState({
    contactId: "",
    orderId: "",
    items: "",
    total: "",
    shopName: "Toko Saya",
    estimatedDelivery: "2-3 hari kerja",
    bankAccount: "BCA 1234567890 a.n Toko Saya"
  });

  const [paymentForm, setPaymentForm] = useState({
    contactId: "",
    orderId: "",
    amount: "",
    bankAccount: "BCA 1234567890 a.n Toko Saya",
    dueDate: ""
  });

  const [followUpForm, setFollowUpForm] = useState({
    contactId: "",
    reviewLink: "Google/Tokopedia/Shopee"
  });

  const [promoForm, setPromoForm] = useState({
    shopName: "Toko Saya",
    promoTitle: "Flash Sale Weekend",
    discount: "30%",
    period: "Sabtu-Minggu",
    minPurchase: "Rp 100.000",
    promoCode: "WEEKEND30",
    catalogLink: "Chat untuk lihat katalog"
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  }) as { data?: Contact[] };

  const { data: templates } = useQuery({
    queryKey: ["/api/whatsapp/simple/templates"],
  }) as { data?: SimpleWhatsAppTemplate[] };

  const generateLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/simple/generate-link", data);
    },
    onSuccess: (response: any) => {
      // Open WhatsApp link in new tab
      window.open(response.waLink, '_blank');
      
      toast({
        title: "Link WhatsApp Dibuat",
        description: "Link wa.me telah dibuka di tab baru",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Link",
        description: error.message || "Gagal membuat link WhatsApp",
        variant: "destructive",
      });
    },
  });

  const generateBulkLinksMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/simple/bulk-links", data);
    },
    onSuccess: (response: any) => {
      setGeneratedLinks(response.links);
      toast({
        title: "Bulk Links Dibuat",
        description: `${response.totalLinks} link wa.me berhasil dibuat`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Bulk Links",
        description: error.message || "Gagal membuat bulk links",
        variant: "destructive",
      });
    },
  });

  const handleOrderConfirmation = () => {
    if (!orderForm.contactId || !orderForm.orderId || !orderForm.items || !orderForm.total) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    generateLinkMutation.mutate({
      contactId: parseInt(orderForm.contactId),
      templateId: 'order_confirm_simple',
      variables: {
        orderId: orderForm.orderId,
        items: orderForm.items,
        total: orderForm.total,
        shopName: orderForm.shopName,
        estimatedDelivery: orderForm.estimatedDelivery,
        bankAccount: orderForm.bankAccount
      }
    });
  };

  const handlePaymentReminder = () => {
    if (!paymentForm.contactId || !paymentForm.orderId || !paymentForm.amount) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi contact, order ID, dan amount",
        variant: "destructive",
      });
      return;
    }

    generateLinkMutation.mutate({
      contactId: parseInt(paymentForm.contactId),
      templateId: 'payment_reminder_simple',
      variables: {
        orderId: paymentForm.orderId,
        amount: paymentForm.amount,
        bankAccount: paymentForm.bankAccount,
        dueDate: paymentForm.dueDate
      }
    });
  };

  const handleFollowUp = () => {
    if (!followUpForm.contactId) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon pilih contact",
        variant: "destructive",
      });
      return;
    }

    generateLinkMutation.mutate({
      contactId: parseInt(followUpForm.contactId),
      templateId: 'followup_simple',
      variables: {
        reviewLink: followUpForm.reviewLink
      }
    });
  };

  const handlePromoBroadcast = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "Pilih Contacts",
        description: "Pilih minimal 1 contact untuk broadcast promo",
        variant: "destructive",
      });
      return;
    }

    generateBulkLinksMutation.mutate({
      contactIds: selectedContacts,
      templateId: 'promo_broadcast',
      variables: promoForm
    });
  };

  const handleCustomBroadcast = () => {
    if (selectedContacts.length === 0 || !broadcastMessage) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Pilih contacts dan tulis pesan broadcast",
        variant: "destructive",
      });
      return;
    }

    generateBulkLinksMutation.mutate({
      contactIds: selectedContacts,
      message: broadcastMessage
    });
  };

  const toggleContactSelection = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Disalin",
      description: "Link wa.me telah disalin ke clipboard",
    });
  };

  const openAllLinks = () => {
    generatedLinks.forEach((link, index) => {
      setTimeout(() => {
        window.open(link.waLink, '_blank');
      }, index * 1000); // Delay 1 second between opens
    });
  };

  const contactsWithPhone = contacts?.filter(contact => 
    contact.phone && 
    contact.id && 
    contact.firstName && 
    contact.lastName &&
    typeof contact.id === 'number'
  ) || [];

  return (
    <div className="space-y-6 p-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp UMKM</h1>
          <p className="text-gray-600 dark:text-gray-400">Kirim pesan WhatsApp tanpa ribet setup API</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Phone className="h-3 w-3" />
            <span>{contactsWithPhone.length} Contacts</span>
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cara Kerja:</strong> Sistem akan membuat link wa.me yang otomatis buka WhatsApp dengan pesan siap kirim. 
          Tidak perlu API key atau setup rumit!
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quick-messages" className="w-full flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
          <TabsTrigger value="quick-messages">Pesan Cepat</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
        </TabsList>

        {/* Quick Messages */}
        <TabsContent value="quick-messages" className="space-y-6 flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Order Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>Konfirmasi Pesanan</span>
                </CardTitle>
                <CardDescription>
                  Kirim konfirmasi otomatis untuk pesanan baru
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="order-contact">Pilih Customer</Label>
                  <Select value={orderForm.contactId} onValueChange={(value) => setOrderForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactsWithPhone.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName} - {contact.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="order-id">Order ID</Label>
                    <Input
                      id="order-id"
                      value={orderForm.orderId}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, orderId: e.target.value }))}
                      placeholder="ORD001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order-total">Total</Label>
                    <Input
                      id="order-total"
                      value={orderForm.total}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, total: e.target.value }))}
                      placeholder="Rp 500.000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="order-items">Items</Label>
                  <Input
                    id="order-items"
                    value={orderForm.items}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, items: e.target.value }))}
                    placeholder="Sepatu Nike Air Max, Size 42"
                  />
                </div>

                <Button 
                  onClick={handleOrderConfirmation}
                  disabled={generateLinkMutation.isPending}
                  className="w-full"
                >
                  {generateLinkMutation.isPending ? "Membuat Link..." : "Kirim Konfirmasi"}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  <span>Reminder Pembayaran</span>
                </CardTitle>
                <CardDescription>
                  Ingatkan customer untuk segera bayar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment-contact">Pilih Customer</Label>
                  <Select value={paymentForm.contactId} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactsWithPhone.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName} - {contact.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="payment-order">Order ID</Label>
                    <Input
                      id="payment-order"
                      value={paymentForm.orderId}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, orderId: e.target.value }))}
                      placeholder="ORD001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Rp 500.000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-due">Batas Waktu</Label>
                  <Input
                    id="payment-due"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    placeholder="Besok sore"
                  />
                </div>

                <Button 
                  onClick={handlePaymentReminder}
                  disabled={generateLinkMutation.isPending}
                  className="w-full"
                >
                  {generateLinkMutation.isPending ? "Membuat Link..." : "Kirim Reminder"}
                </Button>
              </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Follow-up Review</span>
                </CardTitle>
                <CardDescription>
                  Minta review dari customer yang puas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="followup-contact">Pilih Customer</Label>
                  <Select value={followUpForm.contactId} onValueChange={(value) => setFollowUpForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactsWithPhone.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName} - {contact.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="review-link">Platform Review</Label>
                  <Input
                    id="review-link"
                    value={followUpForm.reviewLink}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, reviewLink: e.target.value }))}
                    placeholder="Google/Tokopedia/Shopee"
                  />
                </div>

                <Button 
                  onClick={handleFollowUp}
                  disabled={generateLinkMutation.isPending}
                  className="w-full"
                >
                  {generateLinkMutation.isPending ? "Membuat Link..." : "Kirim Follow-up"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcast */}
        <TabsContent value="broadcast" className="space-y-6 flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Contact Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Customers</CardTitle>
                <CardDescription>
                  Pilih customer yang akan terima broadcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                  {contactsWithPhone.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedContacts.includes(contact.id)
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleContactSelection(contact.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                        </div>
                        {selectedContacts.includes(contact.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedContacts.length} dari {contactsWithPhone.length} dipilih
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContacts(
                      selectedContacts.length === contactsWithPhone.length 
                        ? [] 
                        : contactsWithPhone.map(c => c.id)
                    )}
                  >
                    {selectedContacts.length === contactsWithPhone.length ? "Batal Semua" : "Pilih Semua"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Broadcast Options */}
            <div className="space-y-4">
              {/* Promo Broadcast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                    <span>Broadcast Promo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Judul Promo</Label>
                      <Input
                        value={promoForm.promoTitle}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, promoTitle: e.target.value }))}
                        placeholder="Flash Sale Weekend"
                      />
                    </div>
                    <div>
                      <Label>Diskon</Label>
                      <Input
                        value={promoForm.discount}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, discount: e.target.value }))}
                        placeholder="30%"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePromoBroadcast}
                    disabled={generateBulkLinksMutation.isPending}
                    className="w-full"
                  >
                    {generateBulkLinksMutation.isPending ? "Membuat Links..." : "Broadcast Promo"}
                  </Button>
                </CardContent>
              </Card>

              {/* Custom Broadcast */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Pesan Custom</Label>
                    <Textarea
                      rows={4}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Tulis pesan broadcast custom..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCustomBroadcast}
                    disabled={generateBulkLinksMutation.isPending}
                    className="w-full"
                  >
                    {generateBulkLinksMutation.isPending ? "Membuat Links..." : "Broadcast Custom"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Generated Links */}
          {generatedLinks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Link WhatsApp Siap Kirim ({generatedLinks.length})</CardTitle>
                  <Button onClick={openAllLinks} size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka Semua Link
                  </Button>
                </div>
                <CardDescription>
                  Klik link atau tombol untuk buka WhatsApp dan kirim pesan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {generatedLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{link.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{link.phone}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLink(link.waLink)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(link.waLink, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template WhatsApp untuk UMKM</CardTitle>
              <CardDescription>
                Template siap pakai yang mudah digunakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {template.template.substring(0, 150)}...
                      </div>
                      <div className="mt-2 text-xs">
                        <strong>Variables:</strong> {template.variables.join(', ')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}