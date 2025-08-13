import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, DollarSign, CheckCircle, XCircle, Tag } from 'lucide-react';
import { VoucherValidationResult } from '@/types/voucher';
import { voucherService } from '@/lib/services/voucherService';
import { toast } from '@/hooks/use-toast';
import { UserContext } from '@/App';

interface VoucherInputProps {
  packageId: string;
  originalPrice: number;
  onVoucherApplied: (result: VoucherValidationResult) => void;
  onVoucherRemoved: () => void;
  appliedVoucher?: VoucherValidationResult;
}

const VoucherInput = ({ 
  packageId, 
  originalPrice, 
  onVoucherApplied, 
  onVoucherRemoved,
  appliedVoucher 
}: VoucherInputProps) => {
  const { user } = useContext(UserContext);
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Error",
        description: "Masukkan kode voucher",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔍 VoucherInput: Starting voucher application...');
      console.log('🔍 VoucherInput: Voucher code:', voucherCode.trim());
      console.log('🔍 VoucherInput: Package ID:', packageId);
      
      setIsValidating(true);
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User tidak ditemukan, silakan login ulang",
          variant: "destructive",
        });
        return;
      }
      
      const result = await voucherService.validateVoucher(voucherCode.trim(), user.id, originalPrice);
      
      console.log('🔍 VoucherInput: Validation result:', result);
      
      if (result.valid) {
        console.log('✅ VoucherInput: Voucher is valid, applying...');
        onVoucherApplied(result);
        setVoucherCode('');
        toast({
          title: "Berhasil",
          description: result.message,
        });
      } else {
        console.log('❌ VoucherInput: Voucher is invalid:', result.message);
        toast({
          title: "Voucher Tidak Valid",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ VoucherInput: Error validating voucher:', error);
      console.error('❌ VoucherInput: Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint'
      });
      toast({
        title: "Error",
        description: "Gagal memvalidasi voucher",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    onVoucherRemoved();
    toast({
      title: "Voucher Dihapus",
      description: "Voucher berhasil dihapus dari pembayaran",
    });
  };

  const getDiscountDisplay = (result: VoucherValidationResult) => {
    if (result.discount_type === 'percentage') {
      return `${result.discount_value}%`;
    } else {
      return `Rp ${result.discount_value?.toLocaleString()}`;
    }
  };

  const getDiscountIcon = (result: VoucherValidationResult) => {
    if (result.discount_type === 'percentage') {
      return <Percent className="w-4 h-4 text-purple-600" />;
    } else {
      return <DollarSign className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Tag className="w-5 h-5 text-blue-600" />
          <span>Voucher Diskon</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!appliedVoucher ? (
          // Voucher Input Form
          <div className="space-y-3">
            <div>
              <Label htmlFor="voucher-code">Kode Voucher</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="voucher-code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode voucher"
                  className="font-mono"
                  disabled={isValidating}
                />
                <Button
                  onClick={handleApplyVoucher}
                  disabled={isValidating || !voucherCode.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? 'Validasi...' : 'Terapkan'}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Masukkan kode voucher untuk mendapatkan diskon</p>
              <p>• Pastikan voucher masih berlaku dan belum digunakan</p>
            </div>
          </div>
        ) : (
          // Applied Voucher Display
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Voucher Berhasil Diterapkan!
                    </h4>
                    <p className="text-sm text-green-700">
                      {appliedVoucher.voucher_name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveVoucher}
                  className="text-red-600 hover:text-red-700 border-red-300"
                >
                  Hapus
                </Button>
              </div>
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getDiscountIcon(appliedVoucher)}
                  <span className="font-medium">Diskon</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {getDiscountDisplay(appliedVoucher)}
                </div>
                <p className="text-sm text-gray-600">
                  Potongan harga
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Total Bayar</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  Rp {appliedVoucher.final_price?.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 line-through">
                  Rp {appliedVoucher.original_price?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Savings Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Hemat:
                </span>
                <Badge variant="default" className="bg-green-600">
                  Rp {appliedVoucher.discount_amount?.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoucherInput;
