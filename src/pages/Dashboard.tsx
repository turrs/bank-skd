import { useContext, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Trophy, Settings, LogOut, History, Star, Zap, Flame, CheckCircle, ChevronLeft, ChevronRight, Play, User, CreditCard, Edit, Lock, X, Eye, EyeOff, MoreHorizontal, FileText, Target, Package, MessageCircle, Send, Minimize2, Maximize2, Users, Hash } from "lucide-react";
import { QuestionPackage, TryoutSession, Payment, UserPackageAccess } from "@/entities";
import { toast } from "@/hooks/use-toast";
import PackageRanking from "@/components/PackageRanking";
import { UserContext } from "@/App";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { signOut, supabase } from "@/lib/db/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart3 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatRoom, RoomMessage } from "@/types/chat";
import { chatService } from "@/lib/services/chatService";
import { PackageCardSkeletonList } from "@/components/PackageCardSkeleton";
import { ChatSkeleton } from "@/components/ChatSkeleton";
import { SmartLoadingSkeleton } from "@/components/SmartLoadingSkeleton";

const Dashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const [packages, setPackages] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [userPackageAccess, setUserPackageAccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAccountSidebar, setShowAccountSidebar] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [accountSidebarCollapsed, setAccountSidebarCollapsed] = useState(true); // Default hide
  const [pendingPayments, setPendingPayments] = useState([]);
  const [profileFormData, setProfileFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Pagination state for packages
  const [currentAvailablePage, setCurrentAvailablePage] = useState(1);
  const [currentMyPackagesPage, setCurrentMyPackagesPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Live Chat State
  const {
    currentRoom,
    messages: chatMessages,
    rooms: chatRooms,
    participants: chatParticipants,
    isLoading: chatLoading,
    error: chatError,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadChatRooms,
    loadRoomMessages, // Add this line
    initializeChat,

  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInitializingChat, setIsInitializingChat] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Debug log untuk user role
    console.log('User in Dashboard:', user);
    console.log('User role:', user.role);
    console.log('User is_admin:', user.is_admin);
    
    loadData();
    // Chat hanya di-initialize ketika user membuka chat
    // initializeChat();
  }, [user]);

  // Tambahkan useEffect untuk refresh data setiap kali halaman dibuka
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentAvailablePage(1);
    setCurrentMyPackagesPage(1);
  }, [activeTab]);

  // Tambahkan data dummy untuk test
  useEffect(() => {
    if (packages.length === 0 && !loading) {
      console.log('No packages found, checking if it\'s a data issue...');
      
      // Test dengan data dummy yang sudah ada discount
      const dummyPackage = {
        id: 'test-id',
        title: 'Test Package',
        description: 'This is a test package',
        is_active: true,
        requires_payment: true,
        price: 50000,
        original_price: 100000,
        discount_percentage: 50,
        discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari lagi
        duration_minutes: 60,
        total_questions: 100,
        is_featured: true
      };
      
      console.log('Dummy package for testing:', dummyPackage);
    }
  }, [packages, loading]);

  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Load paket yang aktif saja (is_active = true)
      const packageResult = await QuestionPackage.list();
      const packageList = packageResult?.data?.filter((pkg: any) => pkg.is_active === true) || [];
      
      console.log('Active packages loaded:', packageList);
      
      const [sessionsResult, paymentsResult] = await Promise.all([
        TryoutSession.list(),
        Payment.list()
      ]);
      
      // Filter sessions dan payments berdasarkan user
      const sessions = sessionsResult?.data?.filter((session: any) => session.user_id === user.id) || [];
      const payments = paymentsResult?.data?.filter((payment: any) => 
        payment.user_id === user.id && payment.status === 'completed'
      ) || [];
      
      console.log('Packages loaded:', packageList);
      console.log('Sessions loaded:', sessions);
      console.log('Sessions details:', sessions.map(s => ({ id: s.id, package_id: s.package_id, status: s.status, user_id: s.user_id })));
      console.log('Payments loaded:', payments);
      
      setPackages(Array.isArray(packageList) ? packageList : []);
      setRecentSessions(Array.isArray(sessions) ? sessions : []);
      setUserPayments(Array.isArray(payments) ? payments : []);
      setUserPackageAccess([]); // Set empty array untuk sementara
    } catch (error) {
      console.error("Error loading data:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Logout dari Supabase Auth
      if (supabase) {
        await signOut();
      }
      
      // Clear user context
      setUser(null);
      
      // Clear localStorage jika ada
      localStorage.removeItem('currentUser');
      
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari sistem",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Gagal logout",
        variant: "destructive",
      });
    }
  };

  const hasAccessToPackage = (packageData) => {
    console.log('Checking access for package:', packageData.id);
    
    // Jika paket tidak memerlukan pembayaran, langsung beri akses
    if (!packageData.requires_payment) {
      console.log('Package does not require payment, access granted');
      return true;
    }
    
    // Fallback: cek dari userPayments jika UserPackageAccess tidak tersedia
    if (userPackageAccess.length === 0) {
      const hasAccess = userPayments.some(payment => 
        payment.package_id === packageData.id && 
        payment.status === 'completed'
      );
      console.log('Using fallback payment check, has access:', hasAccess);
      return hasAccess;
    }
    
    // Cek dari UserPackageAccess jika tersedia
    const hasAccess = userPackageAccess.some(access => 
      access.package_id === packageData.id && 
      access.is_active === true
    );
    
    console.log('Has access:', hasAccess);
    return hasAccess;
  };

  // Function to check if user has ongoing tryout for a specific package
  const hasOngoingTryout = (packageId) => {
    console.log('🔍 Checking ongoing tryout for package:', packageId);
    console.log('📊 Available sessions:', recentSessions);
    
    const ongoingSession = recentSessions.find(session => {
      const isMatch = session.package_id === packageId && session.status === 'in_progress';
      console.log(`Session ${session.id}: package_id=${session.package_id}, status=${session.status}, isMatch=${isMatch}`);
      return isMatch;
    });
    
    console.log('✅ Found ongoing session:', ongoingSession);
    return ongoingSession || null;
  };

  // Function to get tryout button text and action
  const getTryoutButtonInfo = (packageData) => {
    const ongoingSession = hasOngoingTryout(packageData.id);
    
    if (ongoingSession) {
      return {
        text: 'Resume Tryout',
        action: () => navigate(`/tryout/${packageData.id}`),
        variant: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
        icon: <Clock className="w-4 h-4 mr-2" />
      };
    } else {
      return {
        text: 'Mulai Tryout',
        action: () => handleStartTryout(packageData),
        variant: 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800',
        icon: <Play className="w-4 h-4 mr-2" />
      };
    }
  };

  const handleStartTryout = (packageData) => {
    if (packageData.requires_payment && !hasAccessToPackage(packageData)) {
      // Jika belum punya akses, redirect ke payment
      navigate(`/payment/${packageData.id}`);
    } else {
      // Jika sudah punya akses, langsung ke tryout
      navigate(`/tryout/${packageData.id}`);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setProfileUpdating(true);
      
      console.log('Updating profile with data:', profileFormData); // Debug
      
      // Update data user di database
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .update({
            full_name: profileFormData.full_name,
            phone: profileFormData.phone
          })
          .eq('id', user.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        console.log('Profile updated successfully:', data); // Debug
        
        // Update user context dengan data baru
        setUser({
          ...user,
          full_name: profileFormData.full_name,
          phone: profileFormData.phone
        });
        
        // Update localStorage jika ada
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          userData.full_name = profileFormData.full_name;
          userData.phone = profileFormData.phone;
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
        
        toast({
          title: "Berhasil",
          description: "Data pribadi berhasil diupdate",
        });
        
        setShowEditProfile(false);
        
      } else {
        // Fallback untuk mode tanpa Supabase
        const updatedUser = {
          ...user,
          full_name: profileFormData.full_name,
          phone: profileFormData.phone
        };
        
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        toast({
          title: "Berhasil",
          description: "Data pribadi berhasil diupdate (mode lokal)",
        });
        
        setShowEditProfile(false);
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate data pribadi",
        variant: "destructive",
      });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordUpdating(true);
      
      // Validasi input
      if (!profileFormData.current_password || !profileFormData.new_password || !profileFormData.confirm_password) {
        toast({
          title: "Data tidak lengkap",
          description: "Mohon lengkapi semua field password",
          variant: "destructive",
        });
        return;
      }
      
      if (profileFormData.new_password !== profileFormData.confirm_password) {
        toast({
          title: "Password tidak cocok",
          description: "Password baru dan konfirmasi password tidak sama",
          variant: "destructive",
        });
        return;
      }
      
      if (profileFormData.new_password.length < 6) {
        toast({
          title: "Password terlalu pendek",
          description: "Password minimal 6 karakter",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Changing password for user:', user.id); // Debug
      
      // Update password di Supabase Auth
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: profileFormData.new_password
        });
        
        if (error) {
          console.error('Supabase auth error:', error); // Debug
          throw error;
        }
        
        console.log('Password updated successfully in Supabase Auth'); // Debug
        
        // Reset form password
        setProfileFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
        
        toast({
          title: "Berhasil",
          description: "Password berhasil diubah",
        });
        
        setShowChangePassword(false);
        
      } else {
        // Fallback untuk mode tanpa Supabase
        toast({
          title: "Error",
          description: "Supabase tidak tersedia untuk update password",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle specific error cases
      let errorMessage = "Gagal mengubah password";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Password lama tidak benar";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "Password terlalu pendek";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Terlalu banyak percobaan, coba lagi nanti";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Live Chat Functions
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    try {
      console.log('💬 Attempting to send message:', { newMessage, currentRoom });
      
      if (!currentRoom) {
        console.log('🔍 No current room, attempting to initialize chat...');
        setIsInitializingChat(true);
        try {
          await initializeChat();
          // Wait a bit for chat to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
          setIsInitializingChat(false);
        }
        
        // Check if we now have a current room
        if (!currentRoom) {
          console.log('❌ Still no current room after initialization');
          toast({
            title: "Error",
            description: "Chat room not available. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      console.log('📤 Sending message to room:', currentRoom.id);
      await sendMessage({
        room_id: currentRoom.id,
        sender_id: user?.id || '',
        message: newMessage.trim()
      });
      
      setNewMessage('');
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Load pending payments
  const loadPendingPayments = async () => {
    try {
      const payments = await Payment.filter({
        user_id: user.id,
        status: 'pending'
      });
      setPendingPayments(Array.isArray(payments) ? payments : []);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
  };

  // Check payment status
  const checkPaymentStatus = async (paymentId) => {
    try {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/midtrans/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      });
      
      if (!response.ok) throw new Error('Failed to check payment status');
      
      const result = await response.json();
      
      if (result.status === 'completed') {
        toast({
          title: "Pembayaran Berhasil!",
          description: "Paket soal sudah bisa diakses",
        });
        
        // Reload data
        loadData();
        loadPendingPayments();
      }
      
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  // Auto-check pending payments setiap 30 detik
  useEffect(() => {
    if (pendingPayments.length > 0) {
      const interval = setInterval(() => {
        pendingPayments.forEach(payment => {
          checkPaymentStatus(payment.id);
        });
      }, 30000); // 30 detik
      
      return () => clearInterval(interval);
    }
  }, [pendingPayments]);

  // Auto-refresh chat messages when chat sidebar is opened
  useEffect(() => {
    if (isChatOpen && currentRoom && !isInitializingChat) {
      console.log('🔄 Auto-refreshing chat messages for opened sidebar');
      loadRoomMessages(currentRoom.id);
    }
  }, [isChatOpen, currentRoom, isInitializingChat]);

  // Function untuk scroll ke bawah
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const chatContainers = document.querySelectorAll('.chat-messages-container');
      chatContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.scrollTop = container.scrollHeight;
          console.log('📜 Scrolled to bottom:', container);
        }
      });
    }, 100);
  }, []);

  // Auto-scroll to bottom when chat sidebar is opened (desktop & mobile)
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0 && shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false); // Reset flag
    }
  }, [isChatOpen, chatMessages.length, shouldScrollToBottom, scrollToBottom]);

  // Auto-scroll to bottom when chat messages change
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages.length, isChatOpen, scrollToBottom]);

  // Update useEffect untuk load profile data
  useEffect(() => {
    if (user) {
      setProfileFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
          <p className="text-center mt-4 text-blue-700 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BANK CPNS Tryout
              </h1>
              <p className="text-blue-600 font-medium">Selamat datang, {user?.full_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {user?.is_admin && (
                <Link to="/admin" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1 sm:flex-none text-xs sm:text-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Kiri dengan Tab Navigation - Hidden on mobile, visible on desktop */}
        <div className={`bg-white/80 backdrop-blur-md shadow-xl border-r border-blue-100 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } hidden lg:block`}>
          {/* Toggle Button */}
          <div className="flex justify-end p-4 border-b border-blue-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" orientation="vertical">
            <TabsList className="flex flex-col h-auto w-full bg-transparent border-r border-blue-100">
              <TabsTrigger 
                value="available" 
                className={`w-full justify-start px-4 py-3 text-left border-b border-blue-100 rounded-none hover:bg-blue-50 transition-colors ${
                  sidebarCollapsed ? 'px-2 text-center' : 'px-4'
                }`}
              >
                {!sidebarCollapsed && <span className="text-blue-900">Paket Soal</span>}
                {sidebarCollapsed && <BookOpen className="w-5 h-5 mx-auto text-blue-600" />}
              </TabsTrigger>
              <TabsTrigger 
                value="my-packages" 
                className={`w-full justify-start px-4 py-3 text-left border-b border-blue-100 rounded-none hover:bg-blue-50 transition-colors ${
                  sidebarCollapsed ? 'px-2 text-center' : 'px-4'
                }`}
              >
                {!sidebarCollapsed && <span className="text-blue-900">Paket Soal Saya</span>}
                {sidebarCollapsed && <Trophy className="w-5 h-5 mx-auto text-blue-600" />}
              </TabsTrigger>
              
              {/* Tombol Riwayat */}
              <Link to="/history" className="w-full">
                <div className={`w-full justify-start px-4 py-3 text-left border-b border-blue-100 rounded-none hover:bg-blue-50 transition-colors cursor-pointer ${
                  sidebarCollapsed ? 'px-2 text-center' : 'px-4'
                }`}>
                  {!sidebarCollapsed && <span className="text-blue-900">Riwayat</span>}
                  {sidebarCollapsed && <History className="w-5 h-5 mx-auto text-blue-600" />}
                </div>
              </Link>
              
              {/* Tombol Mentor */}
              {user?.role === 'tentor' ? (
                <Link to="/mentor" className="w-full">
                  <div className={`w-full justify-start px-4 py-3 text-left border-b border-blue-100 rounded-none hover:bg-blue-50 transition-colors cursor-pointer ${
                    sidebarCollapsed ? 'px-2 text-center' : 'px-4'
                  }`}>
                    {!sidebarCollapsed && <span className="text-blue-900">Mentor Dashboard</span>}
                    {sidebarCollapsed && <Users className="w-5 h-5 mx-auto text-blue-600" />}
                  </div>
                </Link>
              ) : (
                <Link to="/mentor/register" className="w-full">
                  <div className={`w-full justify-start px-4 py-3 text-left border-b border-blue-100 rounded-none hover:bg-blue-50 transition-colors cursor-pointer ${
                    sidebarCollapsed ? 'px-2 text-center' : 'px-4'
                  }`}>
                    {!sidebarCollapsed && <span className="text-blue-900">Daftar Mentor</span>}
                    {sidebarCollapsed && <Users className="w-5 h-5 mx-auto text-blue-600" />}
                  </div>
                </Link>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Tab Navigation - Visible only on mobile */}
        <div className="lg:hidden bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-blue-50">
              <TabsTrigger value="available" className="text-sm font-medium py-3 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Paket Soal
              </TabsTrigger>
              <TabsTrigger value="my-packages" className="text-sm font-medium py-3 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Paket Soal Saya
              </TabsTrigger>
              <Link to="/history" className="flex items-center justify-center text-sm font-medium py-3 text-blue-700 hover:bg-blue-100 transition-colors">
                <History className="w-4 h-4 mr-1" />
                Riwayat
              </Link>
              {user?.role === 'tentor' ? (
                <Link to="/mentor" className="flex items-center justify-center text-sm font-medium py-3 text-blue-700 hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4 mr-1" />
                  Mentor
                </Link>
              ) : (
                <Link to="/mentor/register" className="flex items-center justify-center text-sm font-medium py-3 text-blue-700 hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4 mr-1" />
                  Mentor
                </Link>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-transparent">
          {/* Tab: Paket Soal (Semua Paket) */}
          {activeTab === "available" && (
            <div className="space-y-6">
              {/* Available Packages dengan UI Marketing */}
              <div className="mb-8">
                
                 {/* Unpurchased Tryout Packages */}
        <SmartLoadingSkeleton 
          isLoading={loading} 
          fallback={
            <div className="mt-8 sm:mt-12">
              
              <PackageCardSkeletonList count={4} />
            </div>
          }
        >
          {packages.filter(pkg => !hasAccessToPackage(pkg)).length > 0 ? (
            <div className="mt-8 sm:mt-12">
             
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages
                  .filter(pkg => !hasAccessToPackage(pkg))
                  .slice((currentAvailablePage - 1) * itemsPerPage, currentAvailablePage * itemsPerPage)
                  .map((pkg) => {
                    const hasDiscount = pkg.discount_percentage > 0;
                    const isExpired = pkg.discount_end_date && new Date(pkg.discount_end_date) < new Date();
                    const finalPrice = hasDiscount && !isExpired ? 
                      pkg.price - (pkg.price * pkg.discount_percentage / 100) : 
                      pkg.price;
                    
                    return (
                      <Card key={pkg.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden rounded-2xl">
                        {/* Header dengan gradient dan icon */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 flex flex-col justify-between">
                          {/* Badges */}
                          <div className="flex items-center space-x-2 mb-4">
                            {pkg.is_featured && (
                              <Badge className="bg-yellow-400 text-yellow-900 border-0 text-xs font-semibold px-3 py-1">
                                ⭐ Featured
                              </Badge>
                            )}
                            {hasDiscount && !isExpired && (
                              <Badge className="bg-red-500 text-white border-0 text-xs font-semibold px-3 py-1">
                                🔥 {pkg.discount_percentage}% OFF
                              </Badge>
                            )}
                          </div>
                          
                          {/* Tech Stack Icons */}
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <Zap className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          
                          {/* Analytics Icon */}
                          <div className="absolute top-4 right-4">
                            <BarChart3 className="w-5 h-5 text-white/80" />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <CardContent className="p-6 space-y-4">
                          {/* Title */}
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                              {pkg.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              Paket soal berkualitas untuk persiapan SKD CPNS
                            </p>
                          </div>
                          
                          {/* Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                <span>{pkg.duration_minutes} menit</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                                <span>{pkg.total_questions} soal</span>
                              </div>
                            </div>
                            
                            {/* Rating */}
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">(5.0)</span>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="text-center py-3 bg-gray-50 rounded-xl">
                            {hasDiscount && !isExpired ? (
                              <div>
                                <div className="text-sm text-gray-500 line-through">
                                  Rp {pkg.original_price?.toLocaleString() || pkg.price?.toLocaleString()}
                                </div>
                                <div className="text-xl font-bold text-red-600">
                                  Rp {finalPrice?.toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xl font-bold text-blue-600">
                                Rp {pkg.price?.toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <Button 
                            onClick={() => navigate(`/payment/${pkg.id}`)}
                            className={`w-full font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                              pkg.is_featured 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                            }`}
                          >
                            {pkg.is_featured ? 'Beli Sekarang' : 'Beli Paket'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ) : null}
        </SmartLoadingSkeleton>
                {loading ? (
                  <PackageCardSkeletonList count={8} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                   
                  </div>
                )}
                
                {/* Tampilkan pesan jika semua paket sudah dibeli */}
                {packages.filter(pkg => !hasAccessToPackage(pkg)).length === 0 && packages.length > 0 && (
                  <Card className="p-8 text-center">
                    <div className="text-gray-500 mb-4">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selamat! 🎉</h3>
                    <p className="text-gray-500">
                      Anda sudah memiliki semua paket soal yang tersedia. Silakan mulai tryout!
                    </p>
                  </Card>
                )}
                
                {/* Tampilkan pesan jika tidak ada paket sama sekali */}
                {packages.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="text-gray-500 mb-4">
                      <Package className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Paket Soal</h3>
                    <p className="text-gray-500">
                      Paket soal akan muncul di sini setelah admin menambahkannya.
                    </p>
                  </Card>
                )}
              </div>
              
              {/* Pagination for Available Packages */}
              {packages.filter(pkg => !hasAccessToPackage(pkg)).length > itemsPerPage && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((currentAvailablePage - 1) * itemsPerPage) + 1} sampai{' '}
                      {Math.min(currentAvailablePage * itemsPerPage, packages.filter(pkg => !hasAccessToPackage(pkg)).length)} dari{' '}
                      {packages.filter(pkg => !hasAccessToPackage(pkg)).length} paket soal
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentAvailablePage(currentAvailablePage - 1)}
                        disabled={currentAvailablePage === 1}
                        className="bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Sebelumnya
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(packages.filter(pkg => !hasAccessToPackage(pkg)).length / itemsPerPage) }, (_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentAvailablePage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentAvailablePage(i + 1)}
                            className={`w-8 h-8 p-0 ${
                              currentAvailablePage === i + 1 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentAvailablePage(currentAvailablePage + 1)}
                        disabled={currentAvailablePage === Math.ceil(packages.filter(pkg => !hasAccessToPackage(pkg)).length / itemsPerPage)}
                        className="bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Paket Soal Saya (Paket yang Sudah Dibeli) */}
          {activeTab === "my-packages" && (
            <div className="space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Paket Soal Saya
                </h2>
                <p className="text-base sm:text-lg text-blue-700 font-medium">Paket soal yang sudah Anda beli dan bisa diakses</p>
              </div>
              
              {loading ? (
                <PackageCardSkeletonList count={3} />
              ) : (() => {
                const myPackages = packages.filter(pkg => hasAccessToPackage(pkg));
                
                if (myPackages.length === 0) {
                  return (
                    <div className="text-center py-8 sm:py-12">
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-100">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-2">Belum Ada Paket Soal</h3>
                        <p className="text-sm sm:text-base text-blue-700 mb-4">
                          Anda belum membeli paket soal apapun. 
                          Silakan pilih paket soal di tab "Paket Soal" untuk memulai.
                        </p>
                        <Button 
                          onClick={() => setActiveTab("available")}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Lihat Paket Soal
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {myPackages
                      .slice((currentMyPackagesPage - 1) * itemsPerPage, currentMyPackagesPage * itemsPerPage)
                      .map((pkg) => {
                        const { text, action, variant, icon } = getTryoutButtonInfo(pkg);
                        const ongoingSession = hasOngoingTryout(pkg.id);
                        
                        return (
                          <Card key={pkg.id} className="hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 sm:p-6">
                              <CardTitle className="text-base sm:text-lg text-white">{pkg.title}</CardTitle>
                              <CardDescription className="text-blue-100 text-sm">{pkg.description}</CardDescription>
                              
                              {/* Status indicator for ongoing tryout */}
                              {ongoingSession && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-orange-100 font-medium">
                                    Tryout sedang berlangsung
                                  </span>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-4 bg-white/90 backdrop-blur-sm p-4 sm:p-6">
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                  <span>{pkg.duration_minutes} menit pengerjaan</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                                  <span>{pkg.total_questions} soal berkualitas</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                  <Zap className="w-4 h-4 mr-2 text-blue-500" />
                                  <span>Pembahasan lengkap</span>
                                </div>
                                
                                {/* Show progress if ongoing tryout */}
                                {ongoingSession && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                      <span>Progress Tryout</span>
                                      <span>Berlangsung</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '25%' }}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                             
                              <Button 
                                className={`w-full ${variant} hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-white font-bold`}
                                onClick={action}
                              >
                                {icon}
                                {text}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                  

                );
              })()}
            </div>
          )}



       
      </div>

        {/* Sidebar Kanan untuk Akun - Hidden on mobile, visible on desktop */}
        <div className={`bg-white/80 backdrop-blur-md shadow-xl border-l border-blue-100 transition-all duration-500 ease-in-out transform ${
          accountSidebarCollapsed ? 'w-16' : 'w-80'
        } hidden lg:block`}>
          <div className="p-4 border-b border-blue-100">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccountSidebarCollapsed(!accountSidebarCollapsed)}
                className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
              >
                {accountSidebarCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!accountSidebarCollapsed ? (
            /* Sidebar Expanded Content dengan animasi scale */
            <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
              {!isChatOpen ? (
                <>
                  {/* Data Pribadi */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Data Pribadi</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Nama Lengkap</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">{user?.full_name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">{user?.email}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Nomor Telepon</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">{user?.phone || 'Belum diisi'}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowEditProfile(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Update Data Pribadi
                    </Button>
                  </div>

                  <Separator />

                  {/* Ganti Password */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Keamanan</h3>
                    </div>
                    
                    <Button 
                      onClick={() => setShowChangePassword(true)}
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Ganti Password
                    </Button>
                  </div>

                  <Separator />

                  {/* History Pembayaran */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">History Pembayaran</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {userPayments.length > 0 ? (
                        userPayments.map((payment) => {
                          const packageName = packages.find(pkg => pkg.id === payment.package_id)?.title || 'Paket Tidak Diketahui';
                          
                          return (
                            <div key={payment.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {packageName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {new Date(payment.created_at).toLocaleDateString('id-ID')}
                                  </div>
                                </div>
                                <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                  {payment.status === 'completed' ? 'Berhasil' : payment.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Rp {payment.amount?.toLocaleString('id-ID')}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Belum ada history pembayaran
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Global Chat */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Global Chat</h3>
                    </div>
                    
                    <Button
                      onClick={async () => {
                        console.log('🔘 Join Global Chat clicked');
                        console.log('📊 Current state:', { isChatOpen, currentRoom: currentRoom?.id });
                        
                        setIsChatOpen(true);
                        setShouldScrollToBottom(true); // Set flag untuk scroll ke bawah
                        
                        // Always initialize chat when opening
                        if (!currentRoom) {
                          console.log('🚀 No current room, initializing chat...');
                          console.log('📊 Current chat state:', { currentRoom, chatMessages, chatParticipants });
                          setIsInitializingChat(true);
                          try {
                            await initializeChat();
                            console.log('✅ Chat initialization completed');
                          } catch (error) {
                            console.error('❌ Error during chat initialization:', error);
                          } finally {
                            setIsInitializingChat(false);
                          }
                        } else {
                          // Refresh messages for existing room
                          console.log('🔄 Refreshing chat messages for existing room');
                          await loadRoomMessages(currentRoom.id);
                        }
                      }}
                      disabled={isInitializingChat}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {isInitializingChat ? 'Initializing...' : 'Join Global Chat'}
                    </Button>
                  </div>
                </>
              ) : (
                                 /* Live Chat Active View */
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <MessageCircle className="w-5 h-5 text-blue-600" />
                       <h3 className="text-lg font-medium text-gray-900">
                         {currentRoom?.name || 'Global Chat'}
                       </h3>
                       <div className="flex items-center space-x-2">
                         {chatParticipants.length > 0 && (
                           <Badge variant="outline" className="text-xs">
                             <Users className="w-3 h-3 mr-1" />
                             {chatParticipants.length}
                           </Badge>
                         )}
                         <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">
                           <Clock className="w-3 h-3 mr-1" />
                           {currentRoom?.chat_duration_label || ''}
                         </Badge>
                       </div>
                     </div>
                     <div className="flex items-center space-x-2">
                     
                       <div className="flex items-center space-x-2">
                        
                         
                       </div>
                     </div>
                   </div>
                  
                  {/* Chat Messages */}
                  <div className="max-h-64 overflow-y-auto space-y-2 chat-messages-container">
                    {isInitializingChat || chatLoading ? (
                      <ChatSkeleton messageCount={3} />
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs mb-3">No messages yet. Join the global chat to start!</p>
                                          <div className="text-xs text-gray-400 mb-2">
                   
                   
                  </div>
                        <Button
                          onClick={async () => {
                            setShouldScrollToBottom(true); // Set flag untuk scroll ke bawah
                            if (!currentRoom) {
                              setIsInitializingChat(true);
                              try {
                                await initializeChat();
                              } finally {
                                setIsInitializingChat(false);
                              }
                            }
                          }}
                          disabled={isInitializingChat}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {isInitializingChat ? 'Joining...' : 'Join Global Chat'}
                        </Button>
                      </div>
                    ) : (
                      // Filter out duplicate messages before rendering
                      chatMessages
                        .filter((msg, index, self) => 
                          index === self.findIndex(m => 
                            m.message_id === msg.message_id && 
                            m.sender_id === msg.sender_id && 
                            m.message === msg.message
                          )
                        )
                        .map((msg) => {
                        console.log('🔍 Rendering message:', { id: msg.message_id, content: msg.message, sender: msg.sender_name, time: msg.created_at });
                        const isOwnMessage = msg.sender_id === user?.id;
                        const messageTime = new Date(msg.created_at).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        });
                        
                        return (
                          <div
                            key={`${msg.message_id}-${msg.sender_id}-${msg.created_at}`}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-2 rounded-lg text-xs ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {!isOwnMessage && (
                                <p className="font-medium text-xs mb-1 text-gray-600">
                                  {msg.sender_name}
                                </p>
                              )}
                              <p>{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {messageTime}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}

                  </div>
                  
                  {/* Chat Input - Show when chat is open and user has joined */}
                  {isChatOpen && currentRoom && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ketik pesan..."
                        disabled={isInitializingChat}
                        className="flex-1 px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 disabled:opacity-50 disabled:bg-blue-50 bg-white/80 backdrop-blur-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        size="sm"
                        disabled={!newMessage.trim() || chatLoading || isInitializingChat}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Sidebar Collapsed Content - Icon Only dengan hover effect */
            <div className="p-4 space-y-6">
              <div className="text-center group cursor-pointer" onClick={() => {
                setAccountSidebarCollapsed(false);
                setIsChatOpen(false);
              }}>
                <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-all duration-200 group-hover:scale-110">
                  <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 group-hover:text-blue-600">Akun</div>
                </div>
              </div>

              {/* Live Chat Icon - Collapsed Sidebar */}
              <div className="text-center group cursor-pointer" onClick={() => {
                setAccountSidebarCollapsed(false);
                setIsChatOpen(true);
              }}>
                <div className={`p-2 rounded-lg transition-all duration-200 group-hover:scale-110 ${
                  isChatOpen 
                    ? 'bg-blue-50 group-hover:bg-blue-100' 
                    : 'group-hover:bg-blue-50'
                }`}>
                  <MessageCircle className={`w-6 h-6 mx-auto mb-2 ${
                    isChatOpen ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                  }`} />
                  <div className={`text-xs ${
                    isChatOpen ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                  }`}>
                    {isChatOpen ? 'Chat Aktif' : 'Chat'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Account Button - Visible only on mobile */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowAccountSidebar(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full w-14 h-14 shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-110"
          >
            <User className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Account Modal */}
        <Dialog open={showAccountSidebar} onOpenChange={setShowAccountSidebar}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Akun Saya
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Data Pribadi */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Data Pribadi</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nama Lengkap</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{user?.full_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{user?.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nomor Telepon</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{user?.phone || 'Belum diisi'}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowEditProfile(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Data Pribadi
                </Button>
              </div>

              <Separator />

              {/* Ganti Password */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Keamanan</h3>
                </div>
                
                <Button 
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Ganti Password
                </Button>
              </div>

              <Separator />

              {/* History Pembayaran */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">History Pembayaran</h3>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {userPayments.length > 0 ? (
                    userPayments.map((payment) => {
                      const packageName = packages.find(pkg => pkg.id === payment.package_id)?.title || 'Paket Tidak Diketahui';
                      
                      return (
                        <div key={payment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {packageName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(payment.created_at).toLocaleDateString('id-ID')}
                              </div>
                            </div>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status === 'completed' ? 'Berhasil' : payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Rp {payment.amount?.toLocaleString('id-ID')}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Belum ada history pembayaran
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Global Chat - Mobile */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Global Chat</h3>
                </div>
                
                {!isChatOpen ? (
                  <Button 
                    onClick={async () => {
                      setIsChatOpen(true);
                      setShouldScrollToBottom(true); // Set flag untuk scroll ke bawah
                      // Initialize chat hanya ketika user membuka chat
                      if (!currentRoom) {
                        setIsInitializingChat(true);
                        try {
                          await initializeChat();
                        } finally {
                          setIsInitializingChat(false);
                        }
                      } else {
                        // Jika sudah ada room, refresh messages
                        console.log('🔄 Refreshing chat messages for existing room (mobile)');
                        await loadRoomMessages(currentRoom.id);
                      }
                    }}
                    disabled={isInitializingChat}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isInitializingChat ? 'Initializing...' : 'Join Global Chat'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                                       {/* Chat Header */}
                   <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium text-blue-800">
                         {currentRoom?.name || 'Global Chat'}
                       </span>
                       <Badge variant="outline" className="text-xs text-blue-600 bg-blue-100 border-blue-200">
                         <Clock className="w-3 h-3 mr-1" />
                         {currentRoom?.chat_duration_label || '10m'}
                       </Badge>
                     </div>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setIsChatOpen(false)}
                       className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
                     >
                       <Minimize2 className="w-3 h-3" />
                     </Button>
                   </div>
                    
                    {/* Chat Messages */}
                    <div className="max-h-48 overflow-y-auto space-y-2 chat-messages-container">
                      {isInitializingChat ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-2">Initializing chat...</p>
                        </div>
                      ) : chatLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-2">Loading messages...</p>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs mb-3">No messages yet. Join the global chat to start!</p>
                          <p className="text-xs text-gray-400 mb-3">Chat hanya menampilkan pesan {currentRoom?.chat_duration_label || '10 menit'} terakhir</p>
                          <Button
                            onClick={async () => {
                              setShouldScrollToBottom(true); // Set flag untuk scroll ke bawah
                              if (!currentRoom) {
                                setIsInitializingChat(true);
                                try {
                                  await initializeChat();
                                } finally {
                                  setIsInitializingChat(false);
                                }
                              }
                            }}
                            disabled={isInitializingChat}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {isInitializingChat ? 'Joining...' : 'Join Global Chat'}
                          </Button>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isOwnMessage = msg.sender_id === user?.id;
                          const messageTime = new Date(msg.created_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          return (
                            <div
                              key={msg.message_id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-2 rounded-lg text-xs ${
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {!isOwnMessage && (
                                  <p className="font-medium text-xs mb-1 text-gray-600">
                                    {msg.sender_name}
                                  </p>
                                )}
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {messageTime}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Chat Input - Only show when there are messages */}
                    {chatMessages.length > 0 && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ketik pesan..."
                          disabled={isInitializingChat}
                          className="flex-1 px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 disabled:opacity-50 disabled:bg-blue-50 bg-white/80 backdrop-blur-sm"
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="sm"
                          disabled={!newMessage.trim() || chatLoading || isInitializingChat}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal Edit Profile */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Edit Data Pribadi
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              Update informasi pribadi Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={profileFormData.full_name}
                onChange={(e) => setProfileFormData({...profileFormData, full_name: e.target.value})}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={profileFormData.phone}
                onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditProfile(false)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                Batal
              </Button>
              <Button 
                onClick={handleUpdateProfile}
                disabled={profileUpdating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {profileUpdating ? 'Mengupdate...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Change Password */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ganti Password
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              Masukkan password lama dan password baru Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="current_password">Password Lama</Label>
              <Input
                id="current_password"
                type="password"
                value={profileFormData.current_password}
                onChange={(e) => setProfileFormData({...profileFormData, current_password: e.target.value})}
                placeholder="Masukkan password lama"
              />
            </div>
            
            <div>
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                value={profileFormData.new_password}
                onChange={(e) => setProfileFormData({...profileFormData, new_password: e.target.value})}
                placeholder="Masukkan password baru (min. 6 karakter)"
              />
            </div>
            
            <div>
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm_password"
                type="password"
                value={profileFormData.confirm_password}
                onChange={(e) => setProfileFormData({...profileFormData, confirm_password: e.target.value})}
                placeholder="Konfirmasi password baru"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowChangePassword(false)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                Batal
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={passwordUpdating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {passwordUpdating ? 'Mengubah...' : 'Ubah Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pembayaran Pending</h2>
          <div className="space-y-4">
            {pendingPayments.map((payment) => (
              <Card key={payment.id} className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800">
                        Pembayaran untuk paket soal sedang diproses
                      </p>
                      <p className="text-sm text-yellow-600">
                        ID: {payment.id.substring(0, 8)}...
                      </p>
                    </div>
                    <Button
                      onClick={() => checkPaymentStatus(payment.id)}
                      variant="outline"
                      size="sm"
                    >
                      Cek Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;