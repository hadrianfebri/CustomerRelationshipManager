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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Users, Zap, CheckCircle, Clock, AlertCircle, Phone, ShoppingCart, CreditCard, Star } from "lucide-react";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  status: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: any[];
}

export default function WhatsApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});

  // Quick message forms
  const [orderForm, setOrderForm] = useState({
    contactId: "",
    orderNumber: "",
    items: "",
    total: "",
    deliveryDate: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    contactId: "",
    orderNumber: "",
    amount: "",
    dueDate: "",
    paymentLink: ""
  });

  const [followUpForm, setFollowUpForm] = useState({
    contactId: "",
    purchaseDate: ""
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  }) as { data?: Contact[] };

  const { data: templates } = useQuery({
    queryKey: ["/api/whatsapp/templates"],
  }) as { data?: WhatsAppTemplate[] };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/send-message", data);
    },
    onSuccess: () => {
      toast({
        title: "Pesan Terkirim",
        description: "WhatsApp message berhasil dikirim",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim",
        description: error.message || "Gagal mengirim WhatsApp message",
        variant: "destructive",
      });
    },
  });

  const sendOrderConfirmationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/send-order-confirmation", data);
    },
    onSuccess: () => {
      toast({
        title: "Konfirmasi Pesanan Terkirim",
        description: "Konfirmasi pesanan telah dikirim via WhatsApp",
      });
      setOrderForm({ contactId: "", orderNumber: "", items: "", total: "", deliveryDate: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim",
        description: error.message || "Gagal mengirim konfirmasi pesanan",
        variant: "destructive",
      });
    },
  });

  const sendPaymentReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/send-payment-reminder", data);
    },
    onSuccess: () => {
      toast({
        title: "Reminder Pembayaran Terkirim",
        description: "Reminder pembayaran telah dikirim via WhatsApp",
      });
      setPaymentForm({ contactId: "", orderNumber: "", amount: "", dueDate: "", paymentLink: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim",
        description: error.message || "Gagal mengirim reminder pembayaran",
        variant: "destructive",
      });
    },
  });

  const sendFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/send-follow-up", data);
    },
    onSuccess: () => {
      toast({
        title: "Follow-up Terkirim",
        description: "Follow-up message telah dikirim via WhatsApp",
      });
      setFollowUpForm({ contactId: "", purchaseDate: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim",
        description: error.message || "Gagal mengirim follow-up",
        variant: "destructive",
      });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/whatsapp/broadcast", data);
    },
    onSuccess: () => {
      toast({
        title: "Broadcast Terkirim",
        description: "Message broadcast berhasil dikirim",
      });
      setBroadcastMessage("");
      setSelectedContacts([]);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Broadcast",
        description: error.message || "Gagal mengirim broadcast",
        variant: "destructive",
      });
    },
  });

  const handleOrderConfirmation = () => {
    if (!orderForm.contactId || !orderForm.orderNumber || !orderForm.items || !orderForm.total) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    sendOrderConfirmationMutation.mutate({
      contactId: parseInt(orderForm.contactId),
      orderDetails: {
        orderNumber: orderForm.orderNumber,
        items: orderForm.items,
        total: orderForm.total,
        deliveryDate: orderForm.deliveryDate
      }
    });
  };

  const handlePaymentReminder = () => {
    if (!paymentForm.contactId || !paymentForm.orderNumber || !paymentForm.amount || !paymentForm.dueDate) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    sendPaymentReminderMutation.mutate({
      contactId: parseInt(paymentForm.contactId),
      orderDetails: {
        orderNumber: paymentForm.orderNumber,
        amount: paymentForm.amount,
        dueDate: paymentForm.dueDate,
        paymentLink: paymentForm.paymentLink
      }
    });
  };

  const handleFollowUp = () => {
    if (!followUpForm.contactId || !followUpForm.purchaseDate) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi contact dan tanggal pembelian",
        variant: "destructive",
      });
      return;
    }

    sendFollowUpMutation.mutate({
      contactId: parseInt(followUpForm.contactId),
      purchaseDate: followUpForm.purchaseDate
    });
  };

  const handleBroadcast = () => {
    if (selectedContacts.length === 0 || !broadcastMessage) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Pilih contacts dan tulis pesan broadcast",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      contactIds: selectedContacts,
      message: broadcastMessage,
      templateName: selectedTemplate === "none" ? undefined : selectedTemplate || undefined,
      templateParams: Object.keys(templateParams).length > 0 ? templateParams : undefined
    });
  };

  const toggleContactSelection = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const contactsWithPhone = contacts?.filter(contact => 
    contact.phone && 
    contact.id && 
    contact.firstName && 
    contact.lastName &&
    typeof contact.id === 'number'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Business</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola komunikasi WhatsApp dengan pelanggan</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Phone className="h-3 w-3" />
            <span>{contactsWithPhone.length} Contacts with Phone</span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contactsWithPhone.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="quick-messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-messages">Quick Messages</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Quick Messages */}
        <TabsContent value="quick-messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Order Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>Konfirmasi Pesanan</span>
                </CardTitle>
                <CardDescription>
                  Kirim konfirmasi pesanan otomatis ke pelanggan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="order-contact">Pilih Contact</Label>
                  <Select value={orderForm.contactId} onValueChange={(value) => setOrderForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih contact" />
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
                  <Label htmlFor="order-number">No. Pesanan</Label>
                  <Input
                    id="order-number"
                    value={orderForm.orderNumber}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="ORD001"
                  />
                </div>

                <div>
                  <Label htmlFor="order-items">Items</Label>
                  <Input
                    id="order-items"
                    value={orderForm.items}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, items: e.target.value }))}
                    placeholder="Sepatu Nike Air Max"
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

                <div>
                  <Label htmlFor="delivery-date">Estimasi Kirim (Optional)</Label>
                  <Input
                    id="delivery-date"
                    value={orderForm.deliveryDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    placeholder="3-5 hari kerja"
                  />
                </div>

                <Button 
                  onClick={handleOrderConfirmation}
                  disabled={sendOrderConfirmationMutation.isPending}
                  className="w-full"
                >
                  {sendOrderConfirmationMutation.isPending ? "Mengirim..." : "Kirim Konfirmasi"}
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
                  Kirim reminder pembayaran yang pending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment-contact">Pilih Contact</Label>
                  <Select value={paymentForm.contactId} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih contact" />
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
                  <Label htmlFor="payment-order">No. Pesanan</Label>
                  <Input
                    id="payment-order"
                    value={paymentForm.orderNumber}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="ORD001"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-amount">Jumlah</Label>
                  <Input
                    id="payment-amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Rp 500.000"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-due">Jatuh Tempo</Label>
                  <Input
                    id="payment-due"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    placeholder="20 Januari 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-link">Link Pembayaran (Optional)</Label>
                  <Input
                    id="payment-link"
                    value={paymentForm.paymentLink}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentLink: e.target.value }))}
                    placeholder="https://payment.example.com"
                  />
                </div>

                <Button 
                  onClick={handlePaymentReminder}
                  disabled={sendPaymentReminderMutation.isPending}
                  className="w-full"
                >
                  {sendPaymentReminderMutation.isPending ? "Mengirim..." : "Kirim Reminder"}
                </Button>
              </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Follow-up Pelanggan</span>
                </CardTitle>
                <CardDescription>
                  Tanyakan kepuasan pelanggan setelah pembelian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="followup-contact">Pilih Contact</Label>
                  <Select value={followUpForm.contactId} onValueChange={(value) => setFollowUpForm(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih contact" />
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
                  <Label htmlFor="purchase-date">Tanggal Pembelian</Label>
                  <Input
                    id="purchase-date"
                    value={followUpForm.purchaseDate}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    placeholder="15 Januari 2024"
                  />
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="font-medium mb-2">Template Follow-up:</p>
                  <p>Menanyakan kepuasan produk, kualitas, dan meminta review/rating dari pelanggan.</p>
                </div>

                <Button 
                  onClick={handleFollowUp}
                  disabled={sendFollowUpMutation.isPending}
                  className="w-full"
                >
                  {sendFollowUpMutation.isPending ? "Mengirim..." : "Kirim Follow-up"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcast */}
        <TabsContent value="broadcast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Contact Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Contacts</CardTitle>
                <CardDescription>
                  Pilih pelanggan yang akan menerima broadcast message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
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
                          {contact.company && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{contact.company}</p>
                          )}
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

            {/* Broadcast Message */}
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Message</CardTitle>
                <CardDescription>
                  Tulis pesan yang akan dikirim ke contacts yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="broadcast-message">Pesan Broadcast</Label>
                  <Textarea
                    id="broadcast-message"
                    rows={8}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Ketik pesan broadcast Anda di sini..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {broadcastMessage.length}/1000 karakter
                  </p>
                </div>

                <div>
                  <Label htmlFor="broadcast-template">Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Template</SelectItem>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Akan dikirim ke {selectedContacts.length} contacts
                  </div>
                  <Button 
                    onClick={handleBroadcast}
                    disabled={broadcastMutation.isPending || selectedContacts.length === 0 || !broadcastMessage}
                  >
                    {broadcastMutation.isPending ? "Mengirim..." : "Kirim Broadcast"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Message Templates</CardTitle>
              <CardDescription>
                Template pesan yang sudah disetujui oleh WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                        <Badge variant={template.status === 'approved' ? 'default' : 'secondary'}>
                          {template.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {template.category} | {template.language}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {template.components.map((component, index) => (
                          <div key={index}>
                            <span className="font-medium">{component.type}:</span>{' '}
                            {component.text?.substring(0, 50)}...
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Settings</CardTitle>
              <CardDescription>
                Konfigurasi koneksi dengan WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Setup Required</h4>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  Untuk menggunakan fitur WhatsApp Business, Anda perlu mengkonfigurasi credentials dari Facebook Developer Console:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>WHATSAPP_ACCESS_TOKEN</li>
                  <li>WHATSAPP_PHONE_NUMBER_ID</li>
                  <li>WHATSAPP_VERIFY_TOKEN</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Not Connected</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Not configured</p>
                </div>
              </div>

              <Button variant="outline" disabled>
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}