import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Banknote
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/db/supabase";

interface MentorBalance {
  id: string;
  mentor_id: string;
  total_earnings: number;
  available_balance: number;
  total_withdrawn: number;
  updated_at: string;
}

interface MentorWithdrawal {
  id: string;
  mentor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  processed_at?: string;
  created_at: string;
}

interface MentorEarning {
  id: string;
  mentor_id: string;
  payment_id: string;
  package_id: string;
  student_id: string;
  payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
}

const MentorBalance = ({ mentorId }: { mentorId: string }) => {
  const [balance, setBalance] = useState<MentorBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<MentorWithdrawal[]>([]);
  const [earnings, setEarnings] = useState<MentorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_holder: ''
  });
  
  // Pagination state
  const [currentWithdrawalPage, setCurrentWithdrawalPage] = useState(1);
  const [currentEarningPage, setCurrentEarningPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (mentorId) {
      loadBalanceData();
    }
  }, [mentorId]);

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      
      // Load balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('mentor_balances')
        .select('*')
        .eq('mentor_id', mentorId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error loading balance:', balanceError);
      }

      // Load withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('mentor_withdrawals')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('Error loading withdrawals:', withdrawalsError);
      }

      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('mentor_earnings')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (earningsError) {
        console.error('Error loading earnings:', earningsError);
      }

      // If balance not found, create initial balance
      if (!balanceData) {
        console.log('Balance not found for mentor, will be created when first earning occurs');
        setBalance(null);
      } else {
        setBalance(balanceData);
      }
      
      setWithdrawals(withdrawalsData || []);
      setEarnings(earningsData || []);
      
    } catch (error) {
      console.error('Error loading balance data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async () => {
    try {
      if (!withdrawalForm.amount || !withdrawalForm.bank_name || !withdrawalForm.account_number || !withdrawalForm.account_holder) {
        toast({
          title: "Data tidak lengkap",
          description: "Mohon lengkapi semua field",
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(withdrawalForm.amount);
      if (amount <= 0) {
        toast({
          title: "Jumlah tidak valid",
          description: "Jumlah withdrawal harus lebih dari 0",
          variant: "destructive",
        });
        return;
      }

      if (balance && amount > balance.available_balance) {
        toast({
          title: "Balance tidak cukup",
          description: "Jumlah withdrawal melebihi balance yang tersedia",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('mentor_withdrawals')
        .insert({
          mentor_id: mentorId,
          amount: amount,
          bank_name: withdrawalForm.bank_name,
          account_number: withdrawalForm.account_number,
          account_holder: withdrawalForm.account_holder
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Withdrawal berhasil",
        description: "Permintaan withdrawal telah dikirim dan menunggu persetujuan admin",
      });

      setShowWithdrawalDialog(false);
      setWithdrawalForm({
        amount: '',
        bank_name: '',
        account_number: '',
        account_holder: ''
      });
      
             // Reload data and reset pagination
       loadBalanceData();
       setCurrentWithdrawalPage(1);
      
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim permintaan withdrawal",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination functions
  const getPaginatedWithdrawals = () => {
    const startIndex = (currentWithdrawalPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return withdrawals.slice(startIndex, endIndex);
  };

  const getPaginatedEarnings = () => {
    const startIndex = (currentEarningPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return earnings.slice(startIndex, endIndex);
  };

  const totalWithdrawalPages = Math.ceil(withdrawals.length / itemsPerPage);
  const totalEarningPages = Math.ceil(earnings.length / itemsPerPage);

  // Reset pagination when tab changes
  const handleTabChange = (value: string) => {
    if (value === 'withdrawals') {
      setCurrentWithdrawalPage(1);
    } else if (value === 'earnings') {
      setCurrentEarningPage(1);
    }
  };

  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    label 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
    label: string;
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, label === 'withdrawals' ? withdrawals.length : earnings.length)} of {label === 'withdrawals' ? withdrawals.length : earnings.length} {label}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-400">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      {!balance ? (
        <Card className="p-6">
          <div className="text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Balance Belum Tersedia</h3>
            <p className="text-gray-500">
              Balance akan muncul setelah ada payment completed untuk paket soal Anda.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {(balance.total_earnings || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {(balance.available_balance || 0).toLocaleString()}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
                <p className="text-2xl font-bold text-orange-600">
                  Rp {(balance.total_withdrawn || 0).toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowWithdrawalDialog(true)}
          disabled={!balance || (balance.available_balance || 0) <= 0}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="withdrawals" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
          <TabsTrigger value="earnings">Earnings History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Withdrawal History
              </CardTitle>
              <CardDescription>
                Riwayat permintaan withdrawal Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada riwayat withdrawal</p>
                </div>
                             ) : (
                 <div className="space-y-4">
                   {getPaginatedWithdrawals().map((withdrawal) => (
                     <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="space-y-2">
                         <div className="flex items-center gap-4">
                           <span className="font-semibold text-lg">
                             Rp {withdrawal.amount.toLocaleString()}
                           </span>
                           {getStatusBadge(withdrawal.status)}
                         </div>
                         <div className="text-sm text-gray-600 space-y-1">
                           <p><strong>Bank:</strong> {withdrawal.bank_name}</p>
                           <p><strong>No. Rekening:</strong> {withdrawal.account_number}</p>
                           <p><strong>Atas Nama:</strong> {withdrawal.account_holder}</p>
                           <p><strong>Tanggal:</strong> {new Date(withdrawal.created_at).toLocaleDateString('id-ID')}</p>
                         </div>
                         {withdrawal.admin_notes && (
                           <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                             <strong>Catatan Admin:</strong> {withdrawal.admin_notes}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                   
                   {/* Pagination for Withdrawals */}
                   <Pagination
                     currentPage={currentWithdrawalPage}
                     totalPages={totalWithdrawalPages}
                     onPageChange={setCurrentWithdrawalPage}
                     label="withdrawals"
                   />
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Earnings History
              </CardTitle>
              <CardDescription>
                Riwayat penghasilan dari sesi tryout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada riwayat penghasilan</p>
                </div>
                             ) : (
                 <div className="space-y-4">
                   {getPaginatedEarnings().map((earning) => (
                     <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="space-y-2">
                         <div className="flex items-center gap-4">
                           <span className="font-semibold text-lg text-green-600">
                             Rp {earning.commission_amount.toLocaleString()}
                           </span>
                           {getStatusBadge(earning.status)}
                         </div>
                         <div className="text-sm text-gray-600 space-y-1">
                           <p><strong>Total Session:</strong> Rp {earning.payment_amount.toLocaleString()}</p>
                           <p><strong>Commission Rate:</strong> {earning.commission_rate}%</p>
                           <p><strong>Tanggal:</strong> {new Date(earning.created_at).toLocaleDateString('id-ID')}</p>
                         </div>
                       </div>
                     </div>
                   ))}
                   
                   {/* Pagination for Earnings */}
                   <Pagination
                     currentPage={currentEarningPage}
                     totalPages={totalEarningPages}
                     onPageChange={setCurrentEarningPage}
                     label="earnings"
                   />
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Masukkan detail bank untuk withdrawal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
              />
              {balance && (
                <p className="text-sm text-gray-500 mt-1">
                  Available: Rp {(balance.available_balance || 0).toLocaleString()}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="bank_name">Nama Bank</Label>
              <Input
                id="bank_name"
                placeholder="Contoh: BCA, Mandiri, BNI"
                value={withdrawalForm.bank_name}
                onChange={(e) => setWithdrawalForm({...withdrawalForm, bank_name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="account_number">Nomor Rekening</Label>
              <Input
                id="account_number"
                placeholder="1234567890"
                value={withdrawalForm.account_number}
                onChange={(e) => setWithdrawalForm({...withdrawalForm, account_number: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="account_holder">Atas Nama</Label>
              <Input
                id="account_holder"
                placeholder="Nama pemilik rekening"
                value={withdrawalForm.account_holder}
                onChange={(e) => setWithdrawalForm({...withdrawalForm, account_holder: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawalDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleWithdrawalSubmit}>
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorBalance;
