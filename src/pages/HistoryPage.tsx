import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Trophy, Clock, Target, TrendingUp, X, Eye, Play, BarChart3 } from "lucide-react";
import { TryoutSession, QuestionPackage, QuestionTagStats } from "@/entities";
import { UserContext } from "@/App";

const HistoryPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<Record<string, any>>({});
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tagPointsBySession, setTagPointsBySession] = useState<Record<string, Record<string, number>>>({});
  const [questionTagStats, setQuestionTagStats] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [visibleSessions, setVisibleSessions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(5);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
    // eslint-disable-next-line
  }, [user]);

  // Detect device size for responsive modal
  useEffect(() => {
    const checkDeviceSize = () => {
      setIsMobileDevice(window.innerWidth < 1024); // 1024px is tablet breakpoint
    };
    
    // Check on mount
    checkDeviceSize();
    
    // Add resize listener
    window.addEventListener('resize', checkDeviceSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, []);

  const loadHistory = async () => {
    try {
      console.log('🚀 Loading basic session list...');
      
      // Ambil user dari context - hanya basic session data
      const sessionListRaw = await TryoutSession.list();
      const sessionList = Array.isArray(sessionListRaw?.data) ? sessionListRaw.data.filter((s: any) => s.user_id === user.id) : [];
      
      // Urutkan sessions dari yang terbaru ke terlama berdasarkan created_at
      const sortedSessions = sessionList.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.start_time || 0);
        const dateB = new Date(b.created_at || b.start_time || 0);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });
      
      console.log('📅 Sorted sessions by date:', sortedSessions.map((s: any) => ({
        id: s.id,
        date: s.created_at || s.start_time,
        status: s.status
      })));
      
      setSessions(sortedSessions);
      
      // Load package data for each session - hanya basic info
      const packageIds = [...new Set(sessionList.map((s: any) => s.package_id))];
      const packageData: Record<string, any> = {};
      
      console.log('📦 Loading basic package info for', packageIds.length, 'packages...');
      
      for (const packageId of packageIds) {
        try {
          const pkgResult = await QuestionPackage.get(String(packageId));
          if (pkgResult?.data) {
            // Hanya simpan data yang diperlukan untuk list
            packageData[String(packageId)] = {
              id: pkgResult.data.id,
              title: pkgResult.data.title,
              description: pkgResult.data.description
            };
          }
        } catch (error) {
          console.error(`Error loading package ${packageId}:`, error);
        }
      }
      
      setPackages(packageData);
      console.log('✅ Basic session list loaded successfully');
      
      // Update visible sessions untuk pagination
      updateVisibleSessions(sortedSessions);
      
      // Tag points dan stats akan di-load secara lazy ketika dibutuhkan
      setTagPointsBySession({});
      setQuestionTagStats([]);

    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateStats = () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) return null;

    const totalScore = completedSessions.reduce((sum, s) => sum + s.total_score, 0);
    const averageScore = Math.round(totalScore / completedSessions.length);
    const highestScore = Math.max(...completedSessions.map(s => s.total_score));
    const totalQuestions = completedSessions.reduce((sum, s) => 
      sum + s.correct_answers + s.wrong_answers + s.unanswered, 0);
    const totalCorrect = completedSessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      totalSessions: completedSessions.length,
      averageScore,
      highestScore,
      accuracy
    };
  };

  // Function untuk lazy loading detail session
  const loadSessionDetails = async (sessionId: string) => {
    try {
      console.log('🔍 Loading details for session:', sessionId);
      setLoadingDetails(prev => ({ ...prev, [sessionId]: true }));
      
      // Load tag points untuk session ini
      const statsRaw = await QuestionTagStats.list();
      const stats = Array.isArray(statsRaw?.data) ? statsRaw.data.filter((st: any) => st.session_id === sessionId) : [];
      const perMain: Record<string, number> = {};
      
      for (const st of stats) {
        const main = st.main_category || 'Non Tag';
        const pts = Number(st.total_points || 0);
        perMain[main] = (perMain[main] || 0) + pts;
      }
      
      setTagPointsBySession(prev => ({
        ...prev,
        [sessionId]: perMain
      }));
      
      console.log('✅ Session details loaded for:', sessionId);
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Function untuk lazy loading user stats
  // Function untuk update visible sessions berdasarkan pagination
  const updateVisibleSessions = (allSessions: any[]) => {
    const startIndex = (currentPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    const visible = allSessions.slice(startIndex, endIndex);
    setVisibleSessions(visible);
  };

  // Function untuk next page
  const nextPage = () => {
    const totalPages = Math.ceil(sessions.length / sessionsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Function untuk previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Function untuk go to specific page
  const goToPage = (page: number) => {
    const totalPages = Math.ceil(sessions.length / sessionsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function untuk close modal dan reset selected session
  const closeDetailModal = () => {
    // Only close modal on mobile devices
    if (isMobileDevice) {
      setIsDetailModalOpen(false);
    }
    // Don't reset selectedSession immediately to prevent flickering
    // It will be reset when the modal closes
  };

  // Update visible sessions ketika currentPage berubah
  useEffect(() => {
    if (sessions.length > 0) {
      updateVisibleSessions(sessions);
    }
  }, [currentPage, sessions]);

  // Auto-close modal when selectedSession becomes null (mobile only)
  useEffect(() => {
    if (!selectedSession && isDetailModalOpen && isMobileDevice) {
      setIsDetailModalOpen(false);
    }
  }, [selectedSession, isDetailModalOpen, isMobileDevice]);

  // Reset selectedSession when modal closes (mobile only)
  useEffect(() => {
    if (!isDetailModalOpen && selectedSession && isMobileDevice) {
      // Small delay to allow modal animation to complete
      const timer = setTimeout(() => {
        setSelectedSession(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDetailModalOpen, selectedSession, isMobileDevice]);

  const loadUserStats = async () => {
    try {
      console.log('📊 Loading user statistics...');
      setLoadingStats(true);
      const userStatsRaw = await QuestionTagStats.list();
      const userStats = Array.isArray(userStatsRaw?.data) ? userStatsRaw.data.filter((st: any) => st.user_id === user.id) : [];
      setQuestionTagStats(userStats);
      console.log('✅ User statistics loaded');
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Calculate stats based on current data
  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
          <p className="text-center mt-4 text-blue-700 font-medium">Loading History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Riwayat Tryout
                </h1>
                <p className="text-blue-700 font-medium">Lihat hasil dan statistik tryout Anda</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="bg-blue-50 border border-blue-200">
            <TabsTrigger value="history" className="text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Riwayat
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              onClick={() => {
                // Load user stats hanya ketika tab statistics dibuka
                if (questionTagStats.length === 0) {
                  loadUserStats();
                }
              }}
            >
              Statistik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-6">
            {sessions.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                <CardContent className="p-8 text-center">
                  <p className="text-blue-700 mb-4 font-medium">Belum ada riwayat tryout</p>
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                      Mulai Tryout Pertama
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Daftar Tryout
                  </h2>
                  
                  {/* Session List Container - No Scroll */}
                  <div className="space-y-4">
                    {visibleSessions.map((session, index) => {
                      const globalIndex = (currentPage - 1) * sessionsPerPage + index;
                      return (
                        <Card 
                          key={session.id} 
                          className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-white/80 backdrop-blur-md shadow-lg rounded-xl ${
                            selectedSession?.id === session.id ? 'ring-2 ring-blue-500 shadow-2xl' : ''
                          }`}
                          onClick={() => {
                            if (!session || !session.id) return; // Safety check
                            setSelectedSession(session);
                            // Load details hanya ketika session dipilih
                            if (session.status === 'completed') {
                              loadSessionDetails(session.id);
                            }
                            // Open modal for details only on mobile devices
                            if (isMobileDevice) {
                              setIsDetailModalOpen(true);
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                {/* Nomor urutan dengan badge */}
                                <div className="flex-shrink-0">
                                  <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                                    #{globalIndex + 1}
                                  </Badge>
                                </div>
                                <div>
                                  <h3 className="font-medium">
                                    {packages[session.package_id]?.title || 'Paket Tidak Diketahui'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {new Date(session.created_at).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                {session.status === 'completed' ? 'Selesai' : 'Berlangsung'}
                              </Badge>
                            </div>
                            
                            {session.status === 'completed' && (
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Skor:</span>
                                  <span className={`ml-1 font-bold ${getScoreColor(session.total_score)}`}>
                                    {session.total_score}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Benar:</span>
                                  <span className="ml-1 font-medium text-green-600">
                                    {session.correct_answers}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Salah:</span>
                                  <span className="ml-1 font-medium text-red-600">
                                    {session.wrong_answers}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {sessions.length > sessionsPerPage && (
                    <div className="mt-6 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          ← Sebelumnya
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(sessions.length / sessionsPerPage) }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={currentPage === page 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "border-blue-200 text-blue-700 hover:bg-blue-50"
                              }
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Next Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={currentPage === Math.ceil(sessions.length / sessionsPerPage)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Selanjutnya →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Detail Section - Full Details (No Modal) */}
                <div className="hidden lg:block">
                  <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Detail Tryout
                  </h2>
                  {!selectedSession ? (
                    <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                      <CardContent className="p-8 text-center">
                        <p className="text-blue-700 font-medium">Pilih tryout untuk melihat detail</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                          <CardTitle className="text-blue-900">
                            {packages[selectedSession.package_id]?.title || 'Paket Tidak Diketahui'}
                          </CardTitle>
                          <CardDescription className="text-blue-700">
                            {new Date(selectedSession.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </CardDescription>
                          {/* Review Button */}
                          {selectedSession.status === 'completed' && (
                            <div className="mt-4">
                              <Link to={`/review/${selectedSession.id}`}>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Review Jawaban Lengkap
                                </Button>
                              </Link>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          {selectedSession.status === 'completed' ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className={`text-2xl font-bold ${getScoreColor(selectedSession.total_score)}`}>
                                    {selectedSession.total_score}
                                  </div>
                                  <div className="text-sm text-gray-600">Skor Total</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {selectedSession.correct_answers}
                                  </div>
                                  <div className="text-sm text-gray-600">Jawaban Benar</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                  <div className="text-2xl font-bold text-red-600">
                                    {selectedSession.wrong_answers}
                                  </div>
                                  <div className="text-sm text-gray-600">Jawaban Salah</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-gray-600">
                                    {selectedSession.unanswered}
                                  </div>
                                  <div className="text-sm text-gray-600">Tidak Dijawab</div>
                                </div>
                              </div>

                              {selectedSession.start_time && selectedSession.end_time && (
                                (() => {
                                  const start = new Date(selectedSession.start_time);
                                  const end = new Date(selectedSession.end_time);
                                  const duration = !isNaN(start.getTime()) && !isNaN(end.getTime()) ? Math.round((end.getTime() - start.getTime()) / (1000 * 60)) : 0;
                                  return (
                                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                      <div className="text-lg font-bold text-yellow-600">
                                        {duration} menit
                                      </div>
                                      <div className="text-sm text-gray-600">Waktu Pengerjaan</div>
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          ) : (
                            <div className="text-center p-8">
                              <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800 border-blue-200">Tryout Berlangsung</Badge>
                              <p className="text-blue-700 mb-4 font-medium">Tryout masih dalam proses pengerjaan</p>
                              <Link to={`/tryout/${selectedSession.package_id}`}>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <Play className="w-4 h-4 mr-2" />
                                  Lanjutkan Tryout
                                </Button>
                              </Link>
                            </div>
                          )}
                          {selectedSession?.status === 'completed' && (
                            <div className="mt-3">
                              {loadingDetails[selectedSession.id] ? (
                                <div className="text-center py-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                                  <p className="text-xs text-gray-500 mt-1">Loading detail...</p>
                                </div>
                              ) : tagPointsBySession[selectedSession.id] ? (
                                <>
                                  <div className="text-xs text-gray-600 mb-1">Poin per Kategori:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {(['TWK','TIU','TKP','Non Tag'] as const).map((cat) => {
                                      const val = tagPointsBySession[selectedSession.id][cat];
                                      if (val === undefined) return null;
                                      return (
                                        <Badge key={cat} variant="outline">{cat}: {val}</Badge>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-2">
                                  <p className="text-xs text-gray-500">Detail belum dimuat</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Mobile Detail Section - Simplified with Modal Trigger */}
                <div className="lg:hidden">
                  <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Detail Tryout (Mobile - Modal)
                  </h2>
                  {!selectedSession ? (
                    <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                      <CardContent className="p-8 text-center">
                        <p className="text-blue-700 font-medium">Pilih tryout untuk melihat detail</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                        <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <h3 className="font-semibold text-lg text-blue-900">
                              {packages[selectedSession.package_id]?.title || 'Paket Tidak Diketahui'}
                            </h3>
                            <p className="text-sm text-blue-700">
                              {new Date(selectedSession.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <Button 
                              onClick={() => setIsDetailModalOpen(true)}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail Lengkap
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics">
            {loadingStats ? (
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                  <p className="text-blue-700 font-medium mt-4">Loading statistik...</p>
                </CardContent>
              </Card>
            ) : !stats ? (
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                <CardContent className="p-8 text-center">
                  <p className="text-blue-700 font-medium">Belum ada data statistik</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="text-sm font-medium text-blue-900">Total Tryout</CardTitle>
                    <Trophy className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
                    <p className="text-xs text-blue-700 mt-1">Tryout selesai</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="text-sm font-medium text-blue-900">Rata-rata Skor</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                      {stats.averageScore}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">Dari semua tryout</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="text-sm font-medium text-blue-900">Skor Tertinggi</CardTitle>
                    <Target className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.highestScore)}`}>
                      {stats.highestScore}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">Pencapaian terbaik</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="text-sm font-medium text-blue-900">Akurasi</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.accuracy)}`}>
                      {stats.accuracy}%
                    </div>
                    <p className="text-xs text-blue-700 mt-1">Jawaban benar</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Modal - Only for Mobile Devices */}
        {/* 
          Modal ini hanya muncul pada device mobile (di bawah 1024px).
          Pada device desktop (tablet ke atas), detail tryout ditampilkan
          langsung di sidebar kanan tanpa modal.
        */}
        <Dialog open={isDetailModalOpen && !!selectedSession && isMobileDevice} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-blue-900">
                {selectedSession && packages[selectedSession.package_id]?.title || 'Paket Tidak Diketahui'}
              </DialogTitle>
              <DialogDescription className="text-blue-700">
                {selectedSession ? new Date(selectedSession.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col h-full">
              {!selectedSession ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">Tidak ada session yang dipilih</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto">
                    {selectedSession?.status === 'completed' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className={`text-2xl font-bold ${getScoreColor(selectedSession.total_score)}`}>
                              {selectedSession.total_score}
                            </div>
                            <div className="text-sm text-gray-600">Skor Total</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {selectedSession.correct_answers}
                            </div>
                            <div className="text-sm text-gray-600">Jawaban Benar</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                              {selectedSession.wrong_answers}
                            </div>
                            <div className="text-sm text-gray-600">Jawaban Salah</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                              {selectedSession.unanswered}
                            </div>
                            <div className="text-sm text-gray-600">Tidak Dijawab</div>
                          </div>
                        </div>

                        {selectedSession.start_time && selectedSession.end_time && (
                          (() => {
                            const start = new Date(selectedSession.start_time);
                            const end = new Date(selectedSession.end_time);
                            const duration = !isNaN(start.getTime()) && !isNaN(end.getTime()) ? Math.round((end.getTime() - start.getTime()) / (1000 * 60)) : 0;
                            return (
                              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-lg font-bold text-yellow-600">
                                  {duration} menit
                                </div>
                                <div className="text-sm text-gray-600">Waktu Pengerjaan</div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800 border-blue-200">Tryout Berlangsung</Badge>
                        <p className="text-blue-700 mb-4 font-medium">Tryout masih dalam proses pengerjaan</p>
                        <Link to={`/tryout/${selectedSession.package_id}`}>
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                            Lanjutkan Tryout
                          </Button>
                        </Link>
                      </div>
                    )}
                    {selectedSession?.status === 'completed' && (
                      <div className="mt-3">
                        {loadingDetails[selectedSession.id] ? (
                          <div className="text-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-xs text-gray-500 mt-1">Loading detail...</p>
                          </div>
                        ) : tagPointsBySession[selectedSession.id] ? (
                          <>
                            <div className="text-xs text-gray-600 mb-1">Poin per Kategori:</div>
                            <div className="flex flex-wrap gap-2">
                              {(['TWK','TIU','TKP','Non Tag'] as const).map((cat) => {
                                const val = tagPointsBySession[selectedSession.id][cat];
                                if (val === undefined) return null;
                                return (
                                  <Badge key={cat} variant="outline">{cat}: {val}</Badge>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-gray-500">Detail belum dimuat</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            {selectedSession && (
              <div className="border-t border-blue-100 pt-4 mt-4 space-y-3">
                {selectedSession.status === 'completed' && (
                  <Link to={`/review/${selectedSession.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Review Jawaban Lengkap
                    </Button>
                  </Link>
                )}
                
                {selectedSession.status === 'in_progress' && (
                  <Link to={`/tryout/${selectedSession.package_id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200">
                      <Play className="w-4 h-4 mr-2" />
                      Lanjutkan Tryout
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={closeDetailModal}
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Tutup
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        </div>
    </div>
  );
};

export default HistoryPage;