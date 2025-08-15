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
  Settings,
  Wallet
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PackageForm from "@/components/PackageForm";
import QuestionForm from "@/components/QuestionForm";
import ChatSettings from "@/components/ChatSettings";
import VoucherManagement from "@/components/VoucherManagement";
import VoucherUsageStats from "@/components/VoucherUsageStats";
import AdminWithdrawalManagement from "@/components/AdminWithdrawalManagement";
import { PackageCardSkeletonList } from "@/components/PackageCardSkeleton";
import { TableSkeleton } from "@/components/StatsSkeleton";
import { AdminTableSkeleton } from "@/components/AdminSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState("available");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAvailablePage, setCurrentAvailablePage] = useState(1);
  const [currentMyPackagesPage, setCurrentMyPackagesPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // Mentor approval state
  const [pendingMentors, setPendingMentors] = useState<any[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentAvailablePage(1);
    setCurrentMyPackagesPage(1);
  }, [activeTab]);

  // Load pending mentors when tab changes to mentor-approval
  useEffect(() => {
    if (activeTab === 'mentor-approval') {
      loadPendingMentors();
    }
  }, [activeTab]);

  // Debug: Monitor pendingMentors state changes
  useEffect(() => {
    console.log('🔄 pendingMentors state changed:', pendingMentors);
    console.log('🔄 pendingMentors length:', pendingMentors.length);
    console.log('🔄 pendingMentors type:', typeof pendingMentors);
    console.log('🔄 pendingMentors is array:', Array.isArray(pendingMentors));
  }, [pendingMentors]);

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

  // Load pending mentors
  const loadPendingMentors = async () => {
    try {
      setMentorLoading(true);
      console.log('🔍 Loading pending mentors...');
      
      // Debug: Test permissions and RLS
      console.log('🔐 Testing permissions and RLS...');
      console.log('🔑 Using API Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20) + '...');
      
      // Test 1: Check if we can access the table at all
      const  tableAccess  = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tentor_profiles`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
        }
      ).then(res => res.json());
      
      console.log('📊 Test 1 - Table access (limit=1):',  tableAccess );
      
     
      
      // If we can access but no data, try the original approach
      let workingProfiles = null;
      
      if (tableAccess && tableAccess.length > 0) {
        console.log('✅ Can access table, trying to get all profiles...');
        
        const  allProfiles = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tentor_profiles`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            }
          }
        ).then(res => res.json());
        
        console.log('📊 All profiles:', allProfiles);
        
        if (allProfiles && allProfiles.length > 0) {
          console.log('🔍 Filtering profiles by is_verified...');
          console.log('🔍 Sample profile data:', allProfiles[0]);
          
          workingProfiles = allProfiles.filter((profile: any) => {
            const isVerified = profile.is_verified;
            const isActive = profile.is_active;
            
            console.log('🔍 Profile:', {
              id: profile.id,
              user_id: profile.user_id,
              is_verified: isVerified,
              is_active: isActive,
              type_is_verified: typeof isVerified,
              type_is_active: typeof isActive
            });
            
            // Check multiple conditions for unverified profiles
            const isUnverified = (
              isVerified === false || 
              isVerified === 'false' || 
              isVerified === 0 ||
              isVerified === 'FALSE' ||
              isVerified === null ||
              isVerified === undefined
            );
            
            console.log('🔍 Is unverified?', isUnverified);
            return isUnverified;
          });
          
          console.log('✅ Filtered profiles:', workingProfiles);
          console.log('✅ Number of unverified profiles:', workingProfiles.length);
        }
      }
      
      if (!workingProfiles || workingProfiles.length === 0) {
        console.log('⚠️ No pending mentors found');
        setPendingMentors([]);
        return;
      }
      
      console.log('🔄 Starting to fetch user details for', workingProfiles.length, 'profiles...');
      
      // Get user details for each profile
      const pendingMentorsList = await Promise.all(
        workingProfiles.map(async (profile: any, index: number) => {
          try {
            console.log(`🔄 Fetching user ${index + 1}/${workingProfiles.length}:`, profile.user_id);
            
            const  userData = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${profile.user_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                }
              }
            ).then(res => res.json());
            
            
            
            const user = userData?.[0];
            if (!user) {
              console.error('❌ No user found for profile:', profile.id);
              return null;
            }
            
            const mentorData = {
              id: profile.user_id,
              full_name: user.full_name || 'Unknown',
              email: user.email || 'No email',
              phone: user.phone || '-',
              role: user.role || 'student',
              profile_id: profile.id,
              specialization: profile.specialization,
              experience_years: profile.experience_years,
              education_level: profile.education_level,
              bio: profile.bio,
              hourly_rate: profile.hourly_rate
            };
            
            console.log(`✅ User ${index + 1} processed:`, mentorData);
            return mentorData;
            
          } catch (error) {
            console.error('❌ Error processing profile:', profile.id, error);
            return null;
          }
        })
      );
      
      // Filter out null values and set state
      const validMentors = pendingMentorsList.filter(mentor => mentor !== null);
      console.log('✅ Final pending mentors list:', validMentors);
      console.log('✅ Number of valid mentors:', validMentors.length);
      
      // Set state and log it
      setPendingMentors(validMentors);
      console.log('🔄 State updated with pendingMentors:', validMentors);
      
      // Force re-render check
      setTimeout(() => {
        console.log('⏰ After timeout - Current pendingMentors state:', pendingMentors);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error loading pending mentors:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data mentor pending",
        variant: "destructive",
      });
    } finally {
      setMentorLoading(false);
    }
  };

  // Approve mentor
  const approveMentor = async (userId: string) => {
    try {
      console.log('✅ Approving mentor:', userId);
    
      // Cari mentor yang sesuai userId
      const mentorProfile = pendingMentors.find(mentor => mentor.id === userId);
      if (!mentorProfile) {
        throw new Error('Mentor profile not found');
      }
      console.log('🔍 Mentor profile:', mentorProfile);
    
      // Request PATCH ke Supabase REST API
      const responseVerified = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tentor_profiles?id=eq.${mentorProfile.profile_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            is_verified: true,
            updated_at: new Date().toISOString()
          })
        }
      );
    
      if (!responseVerified.ok) {
        const errorText = await responseVerified.text();
        throw new Error(`HTTP ${responseVerified.status}: ${errorText}`);
      }
    
      const updatedData = await responseVerified.json();
    
      if (!updatedData.length) {
        throw new Error('Update succeeded but no data returned. Check RLS or filter condition.');
      }
    
      console.log('✅ Mentor profile updated:', updatedData[0]);

      
    
      
      console.log('✅ Mentor profile verified:', responseVerified);
      
      // 2. Update user role to tentor
      const  userData = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            role: 'tentor'
          })
        }
      ).then(res => res.json());
      
      
      
      console.log('✅ User role updated to tentor:', userData);
      
      toast({
        title: "Mentor Disetujui!",
        description: "Mentor berhasil disetujui dan dapat mengakses fitur mentor",
      });
      
      // Reload pending mentors
      loadPendingMentors();
      
    } catch (error) {
      console.error('❌ Error approving mentor:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui mentor",
        variant: "destructive",
      });
    }
  };

  // Reject mentor
  const rejectMentor = async (userId: string) => {
    try {
      console.log('❌ Rejecting mentor:', userId);
      
      // Find the mentor profile
      const mentorProfile = pendingMentors.find(mentor => mentor.id === userId);
      if (!mentorProfile) {
        throw new Error('Mentor profile not found');
      }
      
      // 1. Delete tentor_profile
      const  deleteError  = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tentor_profiles?id=eq.${mentorProfile.profile_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
        }
      ).then(res => res.json());
      
      
      
      console.log('✅ Tentor profile deleted', deleteError);
      
      // 2. Update user role back to student
      const userData = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            role: 'student'
          })
        }
      ).then(res => res.json());
    
      
      console.log('✅ User role updated to student:', userData);
      
      toast({
        title: "Mentor Ditolak",
        description: "Pengajuan mentor berhasil ditolak",
      });
      
      // Reload pending mentors
      loadPendingMentors();
      
    } catch (error) {
      console.error('❌ Error rejecting mentor:', error);
      toast({
        title: "Error",
        description: "Gagal menolak mentor",
        variant: "destructive",
      });
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
        creator_id: user.id // Set creator_id for admin
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

  // Create RLS policy for admin access to unverified mentors
  const createAdminRLSPolicy = async () => {
    try {
      console.log('🔧 Creating admin RLS policy...');
      
      // SQL untuk membuat RLS policy baru
      const policySQL = `
        CREATE POLICY "tentor_profiles_select_admin" ON public.tentor_profiles
        FOR SELECT TO public
        USING (
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.is_admin = true
          )
        );
      `;
      
      console.log('📝 Policy SQL:', policySQL);
      
      // Note: Policy ini harus dibuat manual di Supabase SQL Editor
      // karena REST API tidak bisa execute DDL statements
      
      toast({
        title: "RLS Policy Required",
        description: "Buat policy manual di Supabase SQL Editor. Lihat console untuk SQL.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('❌ Error creating RLS policy:', error);
    }
  };

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-12 h-12 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-red-900 font-semibold text-xl">Akses Ditolak</p>
            <p className="text-red-700">Halaman ini hanya untuk admin</p>
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
                <Settings className="h-5 w-5" />
                <span className="font-medium">Kembali</span>
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-blue-600 font-medium">Kelola platform SKD CPNS</p>
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
                  <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
                <div>
                  <p className="text-sm text-gray-600">Paket Featured</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {packages.filter(pkg => pkg.is_featured).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="available" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span className="text-blue-900">Paket Soal</span>
            </TabsTrigger>
            <TabsTrigger value="my-packages" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-blue-900">Paket Soal Saya</span>
            </TabsTrigger>
            <TabsTrigger value="mentor-approval" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-blue-900">Approve Mentor</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawal-management" className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span className="text-blue-900">Withdrawal</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="text-blue-900">Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Available Packages */}
          <TabsContent value="available" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Paket Soal</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Kelola paket soal yang tersedia untuk user
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
                          {pkg.creator_id ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              {pkg.creator_id === user.id ? 'Anda' : 'Mentor'}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
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
          </TabsContent>

          {/* Tab: My Packages */}
          <TabsContent value="my-packages" className="mt-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Paket Soal Saya</h2>
            <p className="text-sm text-gray-600 mt-1">
                      Paket soal yang dibuat oleh Anda
            </p>
                  </div>
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
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <AdminTableSkeleton rowCount={5} />
                    ) : packages
                      .filter(pkg => pkg.creator_id === user.id)
                      .slice((currentMyPackagesPage - 1) * itemsPerPage, currentMyPackagesPage * itemsPerPage)
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
              
              {/* Pagination for My Packages */}
              {packages.filter(pkg => pkg.creator_id === user.id).length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((currentMyPackagesPage - 1) * itemsPerPage) + 1} sampai{' '}
                      {Math.min(currentMyPackagesPage * itemsPerPage, packages.filter(pkg => pkg.creator_id === user.id).length)} dari{' '}
                      {packages.filter(pkg => pkg.creator_id === user.id).length} paket soal
        </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMyPackagesPage(currentMyPackagesPage - 1)}
                        disabled={currentMyPackagesPage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(packages.filter(pkg => pkg.creator_id === user.id).length / itemsPerPage) }, (_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentMyPackagesPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentMyPackagesPage(i + 1)}
                            className="w-8 h-8 p-0"
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMyPackagesPage(currentMyPackagesPage + 1)}
                        disabled={currentMyPackagesPage === Math.ceil(packages.filter(pkg => pkg.creator_id === user.id).length / itemsPerPage)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Mentor Approval */}
          <TabsContent value="mentor-approval" className="mt-6">
            <div className="space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Approve Mentor
                </h2>
                <p className="text-base sm:text-lg text-blue-700 font-medium">
                  Kelola pengajuan mentor yang menunggu persetujuan
                </p>
                
                
              </div>
              
              {mentorLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat data mentor...</p>
                </div>
              ) : pendingMentors.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-100">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-2">
                      Tidak Ada Mentor Pending
                    </h3>
                    <p className="text-sm sm:text-base text-blue-700 mb-4">
                      Semua pengajuan mentor sudah diproses atau belum ada yang mendaftar.
                    </p>
                    
                    {/* RLS Policy Fix Button */}
                    <div className="space-y-3">
                      
                     
                      
                      {/* Manual Refresh Button */}
                      <Button 
                        onClick={loadPendingMentors}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        🔄 Refresh Data
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Daftar Mentor Pending</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {pendingMentors.length} mentor menunggu persetujuan
                        </p>
                      </div>
                      <Button 
                        onClick={loadPendingMentors}
                        variant="outline"
                        size="sm"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Spesialisasi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pengalaman
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          console.log('🔄 Rendering table with pendingMentors:', pendingMentors);
                          console.log('🔄 pendingMentors length in render:', pendingMentors.length);
                          console.log('🔄 pendingMentors is array in render:', Array.isArray(pendingMentors));
                          return pendingMentors.map((mentor, index) => {
                            console.log(`🔄 Rendering mentor ${index}:`, mentor);
                            return (
                              <tr key={mentor.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-600">
                                        {mentor.full_name?.charAt(0) || 'U'}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {mentor.full_name || 'Unknown'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        ID: {mentor.id.slice(0, 8)}...
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {mentor.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {mentor.phone || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {Array.isArray(mentor.specialization) 
                                    ? mentor.specialization.join(', ') 
                                    : mentor.specialization || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {mentor.experience_years || '-'} tahun
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    Pending Approval
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => approveMentor(mentor.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => rejectMentor(mentor.id)}
                                      className="border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Withdrawal Management */}
          <TabsContent value="withdrawal-management" className="mt-6">
            <div className="space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Withdrawal Management
                </h2>
                <p className="text-base sm:text-lg text-blue-700 font-medium">
                  Kelola pengajuan penarikan dana dari mentor
                </p>
              </div>
              <AdminWithdrawalManagement />
            </div>
          </TabsContent>

          {/* Tab: Settings */}
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
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
          </TabsContent>
        </Tabs>
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

export default AdminDashboard;