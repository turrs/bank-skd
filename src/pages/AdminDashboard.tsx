import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "@/App";
import { QuestionPackage, Question } from "@/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  MoreHorizontal,
  BookOpen,
  BarChart3,
  Package,
  Users,
  FileText,
  Settings
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PackageForm from "@/components/PackageForm";
import QuestionForm from "@/components/QuestionForm";
import ChatSettings from "@/components/ChatSettings";
import VoucherManagement from "@/components/VoucherManagement";
import VoucherUsageStats from "@/components/VoucherUsageStats";
import { PackageCardSkeletonList } from "@/components/PackageCardSkeleton";
import { TableSkeleton } from "@/components/StatsSkeleton";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";

const AdminDashboard = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [packages, setPackages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddPackageDialog, setShowAddPackageDialog] = useState(false);
  const [showEditPackageDialog, setShowEditPackageDialog] = useState(false);
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('User data:', user); // Debug
    console.log('User is_admin:', user?.is_admin); // Debug
    
    if (!user) {
      console.log('No user, redirecting to login'); // Debug
      navigate('/login');
      return;
    }
    
    if (!user.is_admin) {
      console.log('User is not admin, redirecting to dashboard'); // Debug
      navigate('/dashboard');
      return;
    }
    
    console.log('User is admin, loading data'); // Debug
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [packageResult, questionResult] = await Promise.all([
        QuestionPackage.list(),
        Question.list()
      ]);
      
      // Extract data from Supabase response
      const packageList = packageResult?.data || [];
      const questionList = questionResult?.data || [];
      
      setPackages(Array.isArray(packageList) ? packageList : []);
      setQuestions(Array.isArray(questionList) ? questionList : []);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (formData: any) => {
    try {
      const newPackage = await QuestionPackage.create({
        title: formData.title,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        total_questions: formData.total_questions,
        price: formData.price,
        original_price: formData.original_price,
        discount_percentage: formData.discount_percentage,
        discount_end_date: formData.discount_end_date,
        is_featured: formData.is_featured,
        is_active: true, // Default aktif
        requires_payment: formData.requires_payment,
        threshold_twk: formData.threshold_twk,
        threshold_tiu: formData.threshold_tiu,
        threshold_tkp: formData.threshold_tkp
      });
      
      toast({
        title: "Berhasil",
        description: "Paket soal berhasil ditambahkan",
      });
      
      setShowAddPackageDialog(false);
      loadData();
      
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan paket soal",
        variant: "destructive",
      });
    }
  };

  const handleEditPackage = async (formData) => {
    try {
      await QuestionPackage.update(editingPackage.id, formData);
      
      toast({
        title: "Berhasil",
        description: "Paket soal berhasil diupdate",
      });
      
      setShowEditPackageDialog(false);
      setEditingPackage(null);
      loadData();
      
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate paket soal",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestion = async (formData) => {
    try {
      const newQuestion = await Question.create({
        ...formData,
        package_id: selectedPackageId
      });
      
      toast({
        title: "Berhasil",
        description: "Soal berhasil ditambahkan",
      });
      
      setShowAddQuestionDialog(false);
      setSelectedPackageId(null);
      loadData();
      
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan soal",
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = async (formData) => {
    try {
      await Question.update(editingQuestion.id, formData);
      
      toast({
        title: "Berhasil",
        description: "Soal berhasil diupdate",
      });
      
      setShowEditQuestionDialog(false);
      setEditingQuestion(null);
      loadData();
      
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate soal",
        variant: "destructive",
      });
    }
  };

  // Toggle hide/show paket
  const togglePackageVisibility = async (packageId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      await QuestionPackage.update(packageId, {
        is_active: newStatus
      });
      
      toast({
        title: "Berhasil",
        description: `Paket ${newStatus ? 'ditampilkan' : 'disembunyikan'}`,
      });
      
      loadData();
      
    } catch (error) {
      console.error('Error toggling package visibility:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status paket",
        variant: "destructive",
      });
    }
  };

  const openAddPackageDialog = () => {
    setShowAddPackageDialog(true);
  };

  const openEditPackageDialog = (packageData) => {
    setEditingPackage(packageData);
    setShowEditPackageDialog(true);
  };

  const openAddQuestionDialog = (packageId) => {
    setSelectedPackageId(packageId);
    setShowAddQuestionDialog(true);
  };

  const openEditQuestionDialog = (question) => {
    setEditingQuestion(question);
    setShowEditQuestionDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Kelola paket soal dan pertanyaan</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
              <p className="text-xs text-muted-foreground">
                Paket soal tersedia
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Soal</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questions.length}</div>
              <p className="text-xs text-muted-foreground">
                Soal tersedia
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paket Aktif</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {packages.filter(p => p.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Paket yang ditampilkan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paket Tersembunyi</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {packages.filter(p => !p.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Paket yang disembunyikan
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Add Package Button */}
        <div className="mb-6">
          <Button onClick={openAddPackageDialog} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Paket Soal</span>
          </Button>
        </div>

        {/* Package List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Paket Soal</h2>
            <p className="text-sm text-gray-600 mt-1">
              Kelola paket soal yang tersedia untuk user
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paket Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <AdminTableSkeleton rowCount={5} />
                ) : packages.map((pkg) => (
                  <tr key={pkg.id} className={`hover:bg-gray-50 ${
                    !pkg.is_active ? 'bg-gray-100 opacity-75' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {pkg.is_active ? (
                          <Eye className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <Badge 
                          variant={pkg.is_active ? "default" : "secondary"}
                          className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                        >
                          {pkg.is_active ? 'Aktif' : 'Tersembunyi'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pkg.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pkg.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pkg.original_price && pkg.discount_percentage > 0 ? (
                          <div>
                            <span className="line-through text-gray-500">
                              Rp {pkg.original_price?.toLocaleString()}
                            </span>
                            <br />
                            <span className="text-red-600 font-semibold">
                              Rp {pkg.price?.toLocaleString()}
                            </span>
                            <span className="text-xs text-red-600 ml-1">
                              (-{pkg.discount_percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span>Rp {pkg.price?.toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.duration_minutes} menit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.total_questions} soal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditPackageDialog(pkg)}
                        >
                          Edit
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => togglePackageVisibility(pkg.id, pkg.is_active)}
                              className="flex items-center"
                            >
                              {pkg.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Sembunyikan Paket
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Tampilkan Paket
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/questions/${pkg.id}`)}
                              className="flex items-center"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Kelola Soal
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/package-stats/${pkg.id}`)}
                              className="flex items-center"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Lihat Statistik
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
                    {/* Chat Settings Section */}
                    <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Pengaturan Chat</h2>
                <p className="text-sm text-gray-600">
                  Konfigurasi durasi chat yang akan di-load untuk semua user
                </p>
              </div>
              <ChatSettings onSettingChange={loadData} />
            </div>

            {/* Voucher Management Section */}
            <div className="mb-8">
              <VoucherManagement />
            </div>

            {/* Voucher Usage Stats Section */}
            <div className="mb-8">
              <VoucherUsageStats />
            </div>
      </div>

      {/* Add Package Dialog */}
      <Dialog open={showAddPackageDialog} onOpenChange={setShowAddPackageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Paket Soal Baru</DialogTitle>
          </DialogHeader>
          <PackageForm
            onSubmit={handleAddPackage}
            onCancel={() => setShowAddPackageDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={showEditPackageDialog} onOpenChange={setShowEditPackageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Paket Soal</DialogTitle>
          </DialogHeader>
          <PackageForm
            packageData={editingPackage}
            onSubmit={handleEditPackage}
            onCancel={() => {
              setShowEditPackageDialog(false);
              setEditingPackage(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Soal Baru</DialogTitle>
          </DialogHeader>
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={() => {
              setShowAddQuestionDialog(false);
              setSelectedPackageId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Soal</DialogTitle>
          </DialogHeader>
          <QuestionForm
            questionData={editingQuestion}
            onSubmit={handleEditQuestion}
            onCancel={() => {
              setShowEditQuestionDialog(false);
              setEditingQuestion(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;