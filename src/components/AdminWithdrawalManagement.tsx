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
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Banknote,
  Users,
  Filter,
  Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/db/supabase";

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
  mentor?: {
    full_name: string;
    email: string;
  };
}

interface MentorBalance {
  id: string;
  mentor_id: string;
  total_earnings: number;
  available_balance: number;
  total_withdrawn: number;
  mentor?: {
    full_name: string;
    email: string;
  };
}

const AdminWithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<MentorWithdrawal[]>([]);
  const [balances, setBalances] = useState<MentorBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<MentorWithdrawal | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const loadWithdrawalData = async () => {
    try {
      setLoading(true);
      
      // Load withdrawals with mentor info
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('mentor_withdrawals')
        .select(`
          *,
          mentor:users!mentor_withdrawals_mentor_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('Error loading withdrawals:', withdrawalsError);
      }

      // Load balances with mentor info
      const { data: balancesData, error: balancesError } = await supabase
        .from('mentor_balances')
        .select(`
          *,
          mentor:users!mentor_balances_mentor_id_fkey(full_name, email)
        `)
        .order('available_balance', { ascending: false });

      if (balancesError) {
        console.error('Error loading balances:', balancesError);
      }

      setWithdrawals(withdrawalsData || []);
      setBalances(balancesData || []);
      
    } catch (error) {
      console.error('Error loading withdrawal data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data withdrawal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    try {
      let newStatus: string;
      let notes = adminNotes;

      switch (actionType) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('mentor_withdrawals')
        .update({
          status: newStatus,
          admin_notes: notes,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil",
        description: `Withdrawal berhasil ${actionType === 'approve' ? 'disetujui' : actionType === 'reject' ? 'ditolak' : 'diselesaikan'}`,
      });

      setShowActionDialog(false);
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes('');
      
      // Reload data
      loadWithdrawalData();
      
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status withdrawal",
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

  const getActionButtons = (withdrawal: MentorWithdrawal) => {
    if (withdrawal.status === 'pending') {
      return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setActionType('approve');
              setShowActionDialog(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setActionType('reject');
              setShowActionDialog(true);
            }}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      );
    } else if (withdrawal.status === 'approved') {
      return (
        <Button
          size="sm"
          onClick={() => {
            setSelectedWithdrawal(withdrawal);
            setActionType('complete');
            setShowActionDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Mark Complete
        </Button>
      );
    }
    return null;
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      withdrawal.mentor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.account_holder.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-blue-600">
                {withdrawals.length}
              </p>
            </div>
            <Banknote className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {withdrawals.filter(w => w.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {withdrawals.filter(w => w.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-purple-600">
                Rp {(withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Tabs for Management */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="balances">Mentor Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Withdrawal Requests
              </CardTitle>
              <CardDescription>
                Kelola permintaan withdrawal dari mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari mentor, bank, atau nama rekening..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Withdrawals List */}
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada withdrawal request</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="border rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-lg">
                              Rp {withdrawal.amount.toLocaleString()}
                            </span>
                            {getStatusBadge(withdrawal.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Mentor:</strong> {withdrawal.mentor?.full_name || 'Unknown'}</p>
                              <p><strong>Email:</strong> {withdrawal.mentor?.email || 'Unknown'}</p>
                              <p><strong>Bank:</strong> {withdrawal.bank_name}</p>
                            </div>
                            <div>
                              <p><strong>No. Rekening:</strong> {withdrawal.account_number}</p>
                              <p><strong>Atas Nama:</strong> {withdrawal.account_holder}</p>
                              <p><strong>Tanggal:</strong> {new Date(withdrawal.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                          </div>
                          
                          {withdrawal.admin_notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Catatan Admin:</strong> {withdrawal.admin_notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getActionButtons(withdrawal)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Mentor Balances
              </CardTitle>
              <CardDescription>
                Lihat balance dan penghasilan mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada data balance mentor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {balances.map((balance) => (
                    <div key={balance.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{balance.mentor?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{balance.mentor?.email || 'Unknown'}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Earnings</p>
                          <p className="font-semibold text-green-600">Rp {(balance.total_earnings || 0).toLocaleString()}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Available Balance</p>
                          <p className="font-semibold text-blue-600">Rp {(balance.available_balance || 0).toLocaleString()}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Withdrawn</p>
                          <p className="font-semibold text-orange-600">Rp {(balance.total_withdrawn || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Withdrawal' : 
               actionType === 'reject' ? 'Reject Withdrawal' : 
               'Mark as Complete'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' ? 'Setujui permintaan withdrawal ini?' :
               actionType === 'reject' ? 'Tolak permintaan withdrawal ini?' :
               'Tandai withdrawal ini sebagai selesai?'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedWithdrawal && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p><strong>Mentor:</strong> {selectedWithdrawal.mentor?.full_name}</p>
                <p><strong>Amount:</strong> Rp {selectedWithdrawal.amount.toLocaleString()}</p>
                <p><strong>Bank:</strong> {selectedWithdrawal.bank_name}</p>
                <p><strong>Account:</strong> {selectedWithdrawal.account_number}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="admin_notes">Catatan Admin (Opsional)</Label>
              <Textarea
                id="admin_notes"
                placeholder="Tambahkan catatan jika diperlukan..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowActionDialog(false)}
            >
              Batal
            </Button>
            <Button 
              onClick={handleWithdrawalAction}
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {actionType === 'approve' ? 'Approve' : 
               actionType === 'reject' ? 'Reject' : 
               'Complete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalManagement;
