import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Edit2, Trash2, Copy, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { WhatsappTemplate, InsertWhatsappTemplate } from '@shared/schema';

const templateSchema = z.object({
  name: z.string().min(1, 'Nama template wajib diisi'),
  content: z.string().min(1, 'Konten template wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const templateCategories = [
  { value: 'greeting', label: 'Sapaan' },
  { value: 'order_confirmation', label: 'Konfirmasi Pesanan' },
  { value: 'payment_reminder', label: 'Pengingat Pembayaran' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'promotion', label: 'Promosi' },
  { value: 'customer_service', label: 'Layanan Pelanggan' },
  { value: 'shipping', label: 'Pengiriman' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'general', label: 'Umum' },
];

export default function WhatsAppTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsappTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<WhatsappTemplate[]>({
    queryKey: ['/api/whatsapp/templates/custom'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest('POST', '/api/whatsapp/templates/custom', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates/custom'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Template Berhasil Dibuat',
        description: 'Template WhatsApp baru telah ditambahkan.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal Membuat Template',
        description: error.message || 'Terjadi kesalahan saat membuat template.',
        variant: 'destructive',
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TemplateFormData> }) => {
      return await apiRequest('PUT', `/api/whatsapp/templates/custom/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates/custom'] });
      setEditingTemplate(null);
      toast({
        title: 'Template Berhasil Diperbarui',
        description: 'Template WhatsApp telah diperbarui.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal Memperbarui Template',
        description: error.message || 'Terjadi kesalahan saat memperbarui template.',
        variant: 'destructive',
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/whatsapp/templates/custom/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates/custom'] });
      toast({
        title: 'Template Berhasil Dihapus',
        description: 'Template WhatsApp telah dihapus.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal Menghapus Template',
        description: error.message || 'Terjadi kesalahan saat menghapus template.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      content: '',
      category: '',
      isActive: true,
      description: '',
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEdit = (template: WhatsappTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      content: template.content,
      category: template.category,
      isActive: template.isActive ?? true,
      description: template.description || '',
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Disalin ke Clipboard',
      description: 'Template telah disalin ke clipboard.',
    });
  };

  const generateWhatsAppLink = (template: WhatsappTemplate) => {
    const encodedMessage = encodeURIComponent(template.content);
    return `https://wa.me/?text=${encodedMessage}`;
  };

  const getCategoryLabel = (category: string) => {
    return templateCategories.find(cat => cat.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template WhatsApp</h1>
          <p className="text-muted-foreground">
            Kelola template pesan WhatsApp untuk bisnis UMKM Anda
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Template Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template WhatsApp' : 'Buat Template WhatsApp Baru'}
              </DialogTitle>
              <DialogDescription>
                Buat template pesan untuk mempermudah komunikasi dengan pelanggan.
                Gunakan placeholder seperti {`{{nama}}`} untuk personalisasi.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Template</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama template" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Deskripsi singkat template" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konten Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tulis konten template di sini. Gunakan {{placeholder}} untuk personalisasi, contoh: Halo {{nama}}, terima kasih atas pesanan {{produk}} Anda."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Template Aktif</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Template aktif akan ditampilkan dalam daftar template
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTemplate(null);
                      form.reset();
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {editingTemplate ? 'Perbarui Template' : 'Buat Template'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getCategoryLabel(template.category)}
                    </Badge>
                    {template.isActive ? (
                      <Badge variant="default">Aktif</Badge>
                    ) : (
                      <Badge variant="outline">Nonaktif</Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{template.content}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(template.content)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generateWhatsAppLink(template), '_blank')}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Template</h3>
          <p className="text-muted-foreground mb-4">
            Mulai buat template WhatsApp pertama Anda untuk mempermudah komunikasi dengan pelanggan.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Template Pertama
          </Button>
        </div>
      )}
    </div>
  );
}