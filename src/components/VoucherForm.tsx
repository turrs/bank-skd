import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Percent, DollarSign, Package, Users, Clock } from 'lucide-react';
import { CreateVoucherData, UpdateVoucherData, Voucher } from '@/types/voucher';

interface VoucherFormProps {
  voucher?: Voucher;
  onSubmit: (data: CreateVoucherData | UpdateVoucherData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const VoucherForm = ({ voucher, onSubmit, onCancel, isLoading = false }: VoucherFormProps) => {
  const [formData, setFormData] = useState<CreateVoucherData>({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: 0,
    usage_limit: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    applicable_packages: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description || '',
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        min_purchase_amount: voucher.min_purchase_amount,
        max_discount_amount: voucher.max_discount_amount || 0,
        usage_limit: voucher.usage_limit,
        valid_from: new Date(voucher.valid_from).toISOString().split('T')[0],
        valid_until: voucher.valid_until ? new Date(voucher.valid_until).toISOString().split('T')[0] : '',
        applicable_packages: voucher.applicable_packages || []
      });
    }
  }, [voucher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      discount_value: Number(formData.discount_value),
      min_purchase_amount: Number(formData.min_purchase_amount),
      max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : undefined,
      usage_limit: Number(formData.usage_limit),
      // Convert empty date strings to undefined for optional fields
      valid_from: formData.valid_from === '' ? undefined : formData.valid_from,
      valid_until: formData.valid_until === '' ? undefined : formData.valid_until
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: keyof CreateVoucherData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDiscountPreview = () => {
    if (formData.discount_type === 'percentage') {
      return `${formData.discount_value}%`;
    } else {
      return `Rp ${formData.discount_value?.toLocaleString()}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Informasi Voucher</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Kode Voucher *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="WELCOME20"
                required
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="name">Nama Voucher *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Welcome Discount"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Deskripsi voucher untuk user"
              rows={3}
            />
          </div>

          {/* Discount Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discount_type">Tipe Diskon *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'percentage' | 'fixed') => handleInputChange('discount_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4" />
                      <span>Persentase (%)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Nominal (Rp)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount_value">Nilai Diskon *</Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) => handleInputChange('discount_value', e.target.value)}
                placeholder={formData.discount_type === 'percentage' ? '20' : '50000'}
                required
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '1000'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Preview: {getDiscountPreview()}
              </p>
            </div>

            <div>
              <Label htmlFor="min_purchase_amount">Min. Pembelian</Label>
              <Input
                id="min_purchase_amount"
                type="number"
                value={formData.min_purchase_amount}
                onChange={(e) => handleInputChange('min_purchase_amount', e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="showAdvanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="showAdvanced">Tampilkan Opsi Lanjutan</Label>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_discount_amount">Maks. Diskon (Rp)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => handleInputChange('max_discount_amount', e.target.value)}
                    placeholder="100000"
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hanya untuk diskon persentase
                  </p>
                </div>

                <div>
                  <Label htmlFor="usage_limit">Limit Penggunaan</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => handleInputChange('usage_limit', e.target.value)}
                    placeholder="100"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Tanggal Mulai</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => handleInputChange('valid_from', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Tanggal Berakhir</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                    min={formData.valid_from}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Menyimpan...' : voucher ? 'Update Voucher' : 'Buat Voucher'}
        </Button>
      </div>
    </form>
  );
};

export default VoucherForm;
