import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Package, Calendar, DollarSign } from 'lucide-react';
import { voucherService } from '@/lib/services/voucherService';

const VoucherUsageStats = () => {
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading voucher usage stats...');
      
      const { data, error } = await voucherService.getVoucherUsageStats();
      console.log('📊 Voucher usage stats response:', { data, error });
      
      if (error) {
        console.error('❌ Error from voucherService:', error);
        throw error;
      }
      
      console.log('✅ Voucher usage stats loaded successfully:', data);
      setUsageStats(data || []);
    } catch (error) {
      console.error('💥 Error loading voucher usage stats:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Penggunaan Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat statistik...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Statistik Penggunaan Voucher</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usageStats.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada penggunaan voucher</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Total Penggunaan</p>
                    <p className="text-2xl font-bold text-blue-900">{usageStats.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Total Diskon</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(usageStats.reduce((sum, stat) => sum + (stat.discount_amount || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Paket Terjual</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(usageStats.map(stat => stat.package_id)).size}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600">User Aktif</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {new Set(usageStats.map(stat => stat.user_id)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Table */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Riwayat Penggunaan Voucher</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Harga Asli</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Harga Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(stat.used_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{stat.users?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{stat.users?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {stat.vouchers?.code}
                          </code>
                          <p className="text-sm text-gray-600">{stat.vouchers?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{stat.question_packages?.title}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {formatCurrency(stat.original_price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {formatCurrency(stat.discount_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(stat.final_price)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoucherUsageStats;
