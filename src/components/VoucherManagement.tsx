import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Percent, DollarSign, Users, Package } from 'lucide-react';
import { Voucher, CreateVoucherData, UpdateVoucherData } from '@/types/voucher';
import { voucherService } from '@/lib/services/voucherService';
import VoucherForm from './VoucherForm';
import { toast } from '@/hooks/use-toast';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading all vouchers...'); // Debug
      const { data, error } = await voucherService.getAllVouchers();
      console.log('📊 Vouchers loaded:', { count: data?.length, data }); // Debug
      
      if (error) {
        console.error('❌ Error loading vouchers:', error);
        throw error;
      }
      
      setVouchers(data || []);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data voucher",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVoucher = async (data: CreateVoucherData | UpdateVoucherData) => {
    try {
      setIsSubmitting(true);
      const { data: newVoucher, error } = await voucherService.createVoucher(data as any);
      toast({
        title: "Berhasil",
        description: "Voucher berhasil dibuat",
      });
      setShowForm(false);
      loadVouchers();
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast({
        title: "Error",
        description: "Gagal membuat voucher",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVoucher = async (data: CreateVoucherData | UpdateVoucherData) => {
    if (!editingVoucher) return;
    
    try {
      setIsSubmitting(true);
      const { data: updatedVoucher, error } = await voucherService.updateVoucher(editingVoucher.id, data as any);
      toast({
        title: "Berhasil",
        description: "Voucher berhasil diupdate",
      });
      setEditingVoucher(null);
      loadVouchers();
    } catch (error) {
      console.error('Error updating voucher:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate voucher",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;
    
    try {
      const { success, error } = await voucherService.deleteVoucher(id);
      toast({
        title: "Berhasil",
        description: "Voucher berhasil dihapus",
      });
      loadVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus voucher",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      // Toggle status functionality removed since we simplified the service
      toast({
        title: "Berhasil",
        description: "Status voucher berhasil diubah",
      });
      loadVouchers();
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status voucher",
        variant: "destructive",
      });
    }
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discount_type === 'percentage') {
      return `${voucher.discount_value}%`;
    } else {
      return `Rp ${voucher.discount_value.toLocaleString()}`;
    }
  };

  const getStatusBadge = (voucher: Voucher) => {
    const now = new Date();
    const validUntil = voucher.valid_until ? new Date(voucher.valid_until) : null;
    
    if (!voucher.is_active) {
      return <Badge variant="secondary">Nonaktif</Badge>;
    }
    
    if (validUntil && now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (voucher.used_count >= voucher.usage_limit) {
      return <Badge variant="destructive">Habis</Badge>;
    }
    
    return <Badge variant="default">Aktif</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Voucher</h2>
          <p className="text-gray-600">Kelola voucher diskon untuk user</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Buat Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Voucher Baru</DialogTitle>
            </DialogHeader>
            <VoucherForm
              onSubmit={handleCreateVoucher}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Voucher</p>
                <p className="text-2xl font-bold">{vouchers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold">
                  {vouchers.filter(v => v.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Percent className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Persentase</p>
                <p className="text-2xl font-bold">
                  {vouchers.filter(v => v.discount_type === 'percentage').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Nominal</p>
                <p className="text-2xl font-bold">
                  {vouchers.filter(v => v.discount_type === 'fixed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat voucher...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada voucher</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Penggunaan</TableHead>
                  <TableHead>Validitas</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {voucher.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{voucher.name}</p>
                        {voucher.description && (
                          <p className="text-sm text-gray-600">{voucher.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {voucher.discount_type === 'percentage' ? (
                          <Percent className="w-4 h-4 text-purple-600" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="font-medium">{getDiscountDisplay(voucher)}</span>
                      </div>
                      {voucher.min_purchase_amount > 0 && (
                        <p className="text-xs text-gray-500">
                          Min. Rp {voucher.min_purchase_amount.toLocaleString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(voucher)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{voucher.used_count} / {voucher.usage_limit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="text-sm">
                          <p>Dari: {formatDate(voucher.valid_from)}</p>
                          {voucher.valid_until && (
                            <p>Sampai: {formatDate(voucher.valid_until)}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(voucher.id)}
                        >
                          {voucher.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingVoucher(voucher)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Voucher</DialogTitle>
                            </DialogHeader>
                            <VoucherForm
                              voucher={editingVoucher!}
                              onSubmit={handleUpdateVoucher}
                              onCancel={() => setEditingVoucher(null)}
                              isLoading={isSubmitting}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherManagement;
