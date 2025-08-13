import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Clock, Target } from "lucide-react";
import { Payment, TryoutSession, User } from "@/entities";
import { Skeleton } from "@/components/ui/skeleton";

const PackageStats = ({ packageId, packageTitle }) => {
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (packageId) {
      loadStats();
    }
  }, [packageId]);

  const loadStats = async () => {
    try {
      console.log('Loading stats for package:', packageId);
      
      const [paymentListRaw, sessionListRaw] = await Promise.all([
        Payment.list(),
        TryoutSession.list()
      ]);
      
      // Filter dan sort data
      const paymentList = Array.isArray(paymentListRaw?.data) ? paymentListRaw.data.filter((p: any) => 
        p.package_id === packageId && p.status === 'completed'
      ) : [];
      
      const sessionList = Array.isArray(sessionListRaw?.data) ? sessionListRaw.data.filter((s: any) => 
        s.package_id === packageId && s.status === 'completed'
      ).sort((a: any, b: any) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 50) : [];

      console.log('Payment list:', paymentList);
      console.log('Session list:', sessionList);

      // Ensure we have arrays
      const paymentsArray = Array.isArray(paymentList) ? paymentList : [];
      const sessionsArray = Array.isArray(sessionList) ? sessionList : [];

      setPayments(paymentsArray);
      setSessions(sessionsArray);

      // Load user data for sessions
      const userIds = [...new Set(sessionsArray.map(s => s.user_id))];
      console.log('User IDs to load:', userIds);
      
      const userData = {};
      
      for (const userId of userIds) {
        try {
          const user = await User.get(userId);
          userData[userId] = user;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      
      console.log('User data loaded:', userData);
      setUsers(userData);
    } catch (error) {
      console.error("Error loading package stats:", error);
      console.error("Error details:", error.message, error.stack);
      setError(error.message || 'Terjadi kesalahan saat memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        
        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Tabs Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              loadStats();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Statistik Paket: {packageTitle}
        </h2>
        <p className="text-blue-700 font-medium">Data pembayaran dan ranking peserta</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-sm font-medium text-blue-900">Total Pembayaran</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">{payments.length}</div>
            <p className="text-xs text-blue-700 mt-1 font-medium">User yang sudah bayar</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-sm font-medium text-blue-900">Tryout Selesai</CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
            <p className="text-xs text-blue-700 mt-1 font-medium">Sesi completed</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-sm font-medium text-blue-900">Rata-rata Skor</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {sessions.length > 0 
                ? Math.round(sessions.reduce((sum, s) => sum + (s.total_score || 0), 0) / sessions.length)
                : 0
              }
            </div>
            <p className="text-xs text-blue-700 mt-1 font-medium">Dari semua peserta</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-sm font-medium text-blue-900">Skor Tertinggi</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {sessions.length > 0 ? Math.max(...sessions.map(s => s.total_score || 0)) : 0}
            </div>
            <p className="text-xs text-blue-700 mt-1 font-medium">Best score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="bg-blue-50 border border-blue-200">
          <TabsTrigger value="ranking" className="text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Ranking Nilai
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Data Pembayaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
              <CardTitle className="text-blue-900">Ranking Peserta</CardTitle>
              <CardDescription className="text-blue-700">Urutan berdasarkan skor tertinggi</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {sessions.length === 0 ? (
                <p className="text-center text-blue-700 py-8 font-medium">Belum ada data tryout</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">
                            {users[session.user_id]?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-blue-700">
                            {new Date(session.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getScoreBadgeVariant(session.total_score)}>
                          {session.total_score || 0}
                        </Badge>
                        <p className="text-xs text-blue-700 mt-1">
                          {(session.correct_answers || 0)}/{(session.correct_answers || 0) + (session.wrong_answers || 0) + (session.unanswered || 0)} benar
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
              <CardTitle className="text-blue-900">Data Pembayaran</CardTitle>
              <CardDescription className="text-blue-700">User yang sudah melakukan pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {payments.length === 0 ? (
                <p className="text-center text-blue-700 py-8 font-medium">Belum ada pembayaran</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-200">
                      <div>
                        <p className="font-medium text-blue-900">User ID: {payment.user_id}</p>
                        <p className="text-sm text-blue-700">
                          {new Date(payment.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          Rp {payment.amount?.toLocaleString('id-ID')}
                        </p>
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Lunas</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackageStats;