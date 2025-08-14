import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "@/App";
import { QuestionPackage, Question, UserPackageAccess } from "@/entities";
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
  Settings,
  Target,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PackageForm from "@/components/PackageForm";
import QuestionForm from "@/components/QuestionForm";
import { TableSkeleton } from "@/components/StatsSkeleton";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";

const MentorPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [packages, setPackages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userPackageAccess, setUserPackageAccess] = useState<any[]>([]);
  const [showAddPackageDialog, setShowAddPackageDialog] = useState(false);
  const [showEditPackageDialog, setShowEditPackageDialog] = useState(false);
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Pagination state for purchase statistics
  const [currentPurchasePage, setCurrentPurchasePage] = useState(1);
  const [purchaseItemsPerPage] = useState(5);

  useEffect(() => {
    console.log('User data:', user); // Debug
    console.log('User role:', user?.role); // Debug
    
    if (!user) {
      console.log('No user, redirecting to login'); // Debug
      navigate('/login');
      return;
    }
    
    if (user.role !== 'tentor') {
      console.log('User is not tentor, redirecting to dashboard'); // Debug
      navigate('/dashboard');
      return;
    }
    
    console.log('User is tentor, loading data'); // Debug
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [packageResult, questionResult, accessResult] = await Promise.all([
        QuestionPackage.list(),
        Question.list(),
        UserPackageAccess.list()
      ]);
      
      // Extract data from Supabase response
      const packageList = packageResult?.data || [];
      const questionList = questionResult?.data || [];
      const accessList = accessResult?.data || [];
      
      // Filter packages and questions created by current mentor
      const mentorPackages = packageList.filter((pkg: any) => pkg.creator_id === user.id);
      const mentorQuestions = questionList.filter((q: any) => {
        // Find questions that belong to packages created by this mentor
        return mentorPackages.some((pkg: any) => pkg.id === q.package_id);
      });
      
      // Filter user package access for mentor's packages
      const mentorPackageAccess = accessList.filter((access: any) => {
        return mentorPackages.some((pkg: any) => pkg.id === access.package_id);
      });
      
      setPackages(Array.isArray(mentorPackages) ? mentorPackages : []);
      setQuestions(Array.isArray(mentorQuestions) ? mentorQuestions : []);
      setUserPackageAccess(Array.isArray(mentorPackageAccess) ? mentorPackageAccess : []);
      
    } catch (error) {
      console.error('Error loading mentor data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data mentor",
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
        price: formData.price,
        total_questions: formData.total_questions,
        threshold_twk: formData.threshold_twk,
        threshold_tiu: formData.threshold_tiu,
        threshold_tkp: formData.threshold_tkp,
        threshold_non_tag: formData.threshold_non_tag,
        is_active: formData.is_active,
        requires_payment: formData.requires_payment,
        is_featured: formData.is_featured,
        creator_id: user.id // Set creator_id for mentor
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

  const handleEditPackage = async (formData: any) => {
    try {
      await QuestionPackage.update(editingPackage.id, {
        title: formData.title,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        total_questions: formData.total_questions,
        threshold_twk: formData.threshold_twk,
        threshold_tiu: formData.threshold_tiu,
        threshold_tkp: formData.threshold_tkp,
        threshold_non_tag: formData.threshold_non_tag,
        is_active: formData.is_active,
        requires_payment: formData.requires_payment,
        is_featured: formData.is_featured
      });
      
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

  const handleAddQuestion = async (formData: any) => {
    try {
      await Question.create({
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

  const handleEditQuestion = async (formData: any) => {
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

  const openEditPackageDialog = (pkg: any) => {
    setEditingPackage(pkg);
    setShowEditPackageDialog(true);
  };

  const openEditQuestionDialog = (question: any) => {
    setEditingQuestion(question);
    setShowEditQuestionDialog(true);
  };

  const togglePackageVisibility = async (packageId: string, currentStatus: boolean) => {
    try {
      await QuestionPackage.update(packageId, { is_active: !currentStatus });
      
      toast({
        title: "Berhasil",
        description: `Paket berhasil ${!currentStatus ? 'ditampilkan' : 'disembunyikan'}`,
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

  const deletePackage = async (packageId: string) => {
    // Check if package has users with access
    const hasUsers = userPackageAccess.some((access: any) => access.package_id === packageId);
    
    if (hasUsers) {
      toast({
        title: "Tidak Dapat Dihapus",
        description: "Paket soal tidak dapat dihapus karena sudah ada user yang mengakses. Silakan sembunyikan paket terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("Apakah Anda yakin ingin menghapus paket soal ini?")) {
      try {
        await QuestionPackage.delete(packageId);
        
        toast({
          title: "Berhasil",
          description: "Paket soal berhasil dihapus",
        });
        
        loadData();
      } catch (error) {
        console.error('Error deleting package:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus paket soal",
          variant: "destructive",
        });
      }
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      try {
        await Question.delete(questionId);
        
        toast({
          title: "Berhasil",
          description: "Soal berhasil dihapus",
        });
        
        loadData();
      } catch (error) {
        console.error('Error deleting question:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus soal",
          variant: "destructive",
        });
      }
    }
  };

  if (!user || user.role !== 'tentor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-12 h-12 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-red-900 font-semibold text-xl">Akses Ditolak</p>
            <p className="text-red-700">Halaman ini hanya untuk mentor</p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Kembali</span>
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mentor Dashboard
              </h1>
              <p className="text-blue-600 font-medium">Kelola paket soal dan soal Anda</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Paket</p>
                  <p className="text-2xl font-bold text-blue-600">{packages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Soal</p>
                  <p className="text-2xl font-bold text-green-600">{questions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paket Aktif</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {packages.filter(pkg => pkg.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">User Aktif</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {userPackageAccess.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Package List */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Paket Soal Saya</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola paket soal yang Anda buat
                </p>
              </div>
              <Button 
                onClick={() => setShowAddPackageDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Paket
              </Button>
            </div>
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
                    Pembuat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <AdminTableSkeleton rowCount={5} />
                ) : packages
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((pkg) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user?.id === pkg.creator_id ? 'Anda' : 'Pengguna Lain'}
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
                              onClick={() => {
                                setSelectedPackageId(pkg.id);
                                setShowAddQuestionDialog(true);
                              }}
                              className="flex items-center"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Soal
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => deletePackage(pkg.id)}
                              className="flex items-center text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Paket
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
          
          {/* Pagination */}
          {packages.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} sampai{' '}
                  {Math.min(currentPage * itemsPerPage, packages.length)} dari{' '}
                  {packages.length} paket soal
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.ceil(packages.length / itemsPerPage) }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === Math.ceil(packages.length / itemsPerPage)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Soal Saya</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Kelola soal yang Anda buat
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Soal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question, index) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {question.question_text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="outline">
                          {question.main_category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packages.find(pkg => pkg.id === question.package_id)?.title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditQuestionDialog(question)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Package Purchase Statistics */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Statistik Pembelian Paket</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analisis performa paket soal Anda berdasarkan pembelian user
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Sales */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Penjualan</p>
                      <p className="text-2xl font-bold text-green-700">
                        Rp {userPackageAccess.reduce((sum, access) => {
                          const pkg = packages.find(p => p.id === access.package_id);
                          return sum + (pkg?.price || 0);
                        }, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Users */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total User</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {userPackageAccess.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Packages */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Paket Aktif</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {packages.filter(pkg => pkg.is_active).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rate */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {packages.length > 0 ? Math.round((userPackageAccess.length / packages.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Package Performance */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Paket Soal</h3>
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
                        Pembeli
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Pendapatan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages
                      .slice((currentPurchasePage - 1) * purchaseItemsPerPage, currentPurchasePage * purchaseItemsPerPage)
                      .map((pkg) => {
                      const packageAccess = userPackageAccess.filter(access => access.package_id === pkg.id);
                      const totalRevenue = packageAccess.length * (pkg.price || 0);
                      const isActive = pkg.is_active;
                      
                      return (
                        <tr key={pkg.id} className={`hover:bg-gray-50 ${
                          !isActive ? 'bg-gray-100 opacity-75' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {isActive ? (
                                <Eye className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                              )}
                              <Badge 
                                variant={isActive ? "default" : "secondary"}
                                className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                              >
                                {isActive ? 'Aktif' : 'Nonaktif'}
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
                            <div className="text-center">
                              <span className="font-semibold text-blue-600">
                                {packageAccess.length}
                              </span>
                              <br />
                              <span className="text-xs text-gray-500">pembeli</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="text-right">
                              <span className="font-bold text-green-600">
                                Rp {totalRevenue.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              {packageAccess.length > 0 ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Terjual
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Belum Terjual
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination for Package Performance */}
              {packages.length > purchaseItemsPerPage && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((currentPurchasePage - 1) * purchaseItemsPerPage) + 1} sampai{' '}
                      {Math.min(currentPurchasePage * purchaseItemsPerPage, packages.length)} dari{' '}
                      {packages.length} paket soal
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPurchasePage(currentPurchasePage - 1)}
                        disabled={currentPurchasePage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(packages.length / purchaseItemsPerPage) }, (_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentPurchasePage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPurchasePage(i + 1)}
                            className="w-8 h-8 p-0"
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPurchasePage(currentPurchasePage + 1)}
                        disabled={currentPurchasePage === Math.ceil(packages.length / purchaseItemsPerPage)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Purchases */}
            {userPackageAccess.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pembelian Terbaru</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {userPackageAccess
                      .slice((currentPurchasePage - 1) * purchaseItemsPerPage, currentPurchasePage * purchaseItemsPerPage)
                      .map((access, index) => {
                      const pkg = packages.find(p => p.id === access.package_id);
                      return (
                        <div key={access.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {((currentPurchasePage - 1) * purchaseItemsPerPage) + index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pkg?.title || 'Unknown Package'}</p>
                              <p className="text-sm text-gray-600">User ID: {access.user_id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              Rp {pkg?.price?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(access.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {userPackageAccess.length > purchaseItemsPerPage && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                      <p className="text-sm text-gray-600">
                        Dan {userPackageAccess.length - purchaseItemsPerPage} pembelian lainnya...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
            packageData={selectedPackageId}
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
            packageData={editingQuestion?.package_id}
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

export default MentorPage;
