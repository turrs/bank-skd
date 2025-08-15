import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Clock, Target, Users, TrendingUp } from "lucide-react";
import { TryoutSession, User } from "@/entities";
import { Skeleton } from "@/components/ui/skeleton";

const PackageRanking = ({ packageId, packageTitle, limit = 10 }) => {
  const [topScores, setTopScores] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  });

  useEffect(() => {
    if (packageId) {
      loadRanking();
    }
  }, [packageId]);

  const loadRanking = async () => {
    try {
      const sessionsRaw = await TryoutSession.list();
      const sessions = Array.isArray(sessionsRaw?.data) ? sessionsRaw.data.filter((s: any) => 
        s.package_id === packageId && s.status === 'completed'
      ).sort((a: any, b: any) => (b.total_score || 0) - (a.total_score || 0)) : [];
      
      const topSessions = sessions.slice(0, limit);
      setTopScores(topSessions);

      // Calculate stats
      if (sessions.length > 0) {
        const scores = sessions.map(s => s.total_score || 0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        
        setStats({
          totalParticipants: sessions.length,
          averageScore: Math.round(totalScore / sessions.length),
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores)
        });
      }

      // Load user data
      const userIds = [...new Set(topSessions.map(s => s.user_id))];
      const userData = {};
      
      for (const userId of userIds) {
        try {
          const user = await User.get(userId);
          userData[userId] = user;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      
      setUsers(userData);
    } catch (error) {
      console.error("Error loading ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 bg-gray-100 rounded-full">
            {index + 1}
          </div>
        );
    }
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        
        {/* Ranking Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🏆 Top Ranking</CardTitle>
            <CardDescription>{packageTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (topScores.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Ranking</h3>
        <p className="text-gray-500">
          Belum ada peserta yang menyelesaikan tryout untuk paket ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Total Peserta</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalParticipants}</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Rata-rata Skor</p>
          <p className="text-2xl font-bold text-green-600">{stats.averageScore}</p>
        </Card>
        
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Skor Tertinggi</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.highestScore}</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Clock className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Skor Terendah</p>
          <p className="text-2xl font-bold text-red-600">{stats.lowestScore}</p>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            🏆 Top {limit} Ranking
          </CardTitle>
          <CardDescription className="text-base">
            Ranking peserta terbaik untuk paket: {packageTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topScores.map((session, index) => (
            <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                {getRankIcon(index)}
                <div>
                  <p className="font-semibold text-gray-900">
                    {users[session.user_id]?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(session.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={getScoreBadgeVariant(session.total_score)} 
                  className="text-lg px-4 py-2 font-bold"
                >
                  {session.total_score}
                </Badge>
                <p className={`text-sm font-medium mt-1 ${getScoreColor(session.total_score)}`}>
                  {session.total_score >= 80 ? 'Excellent' : 
                   session.total_score >= 60 ? 'Good' : 'Need Improvement'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageRanking;