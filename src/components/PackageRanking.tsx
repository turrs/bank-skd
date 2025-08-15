import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Clock, Target, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/db/supabase";
import { toast } from "@/hooks/use-toast";

const PackageRanking = ({ packageId, packageTitle, limit = 10 }) => {
  const [allScores, setAllScores] = useState([]);
  const [topScores, setTopScores] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (packageId) {
      loadRanking();
    }
  }, [packageId]);

  const loadRanking = async () => {
    try {
      console.log('Loading ranking for package:', packageId);
      
      // Load tryout sessions directly from Supabase
      const sessionsData = await supabase
        .from('tryout_sessions')
        .select(`
          *,
          user:users!tryout_sessions_user_id_fkey(full_name, email)
        `)
        .eq('package_id', packageId)
        .eq('status', 'completed')
        .order('total_score', { ascending: false });

      console.log('Sessions data:', sessionsData);
      console.log('Sessions type:', typeof sessionsData);
      console.log('Sessions length:', sessionsData?.data?.length);
      
      const sessions = sessionsData?.data || [];
      console.log('Processed sessions:', sessions);
      
      // Debug: Check first session structure
      if (sessions.length > 0) {
        console.log('First session structure:', sessions[0]);
        console.log('First session keys:', Object.keys(sessions[0]));
        console.log('First session user data:', sessions[0].user);
      }
      
      setAllScores(sessions);
      
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

      // Simplify user data handling - use the joined data directly
      console.log('Sessions with user data:', sessions.map(s => ({ 
        id: s.id, 
        score: s.total_score, 
        user: s.user,
        user_id: s.user_id 
      })));
      
      // Set users state to empty object since we're using joined data
      setUsers({});
      updatePaginatedScores();
      
      console.log('Ranking loaded successfully. Total sessions:', sessions.length);
    } catch (error) {
      console.error("Error loading tryout sessions:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data ranking tryout",
        variant: "destructive",
      });
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

  // Pagination functions
  const updatePaginatedScores = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedScores = allScores.slice(startIndex, endIndex);
    setTopScores(paginatedScores);
  };

  const totalPages = Math.ceil(allScores.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Update paginated scores when page changes
  useEffect(() => {
    updatePaginatedScores();
  }, [currentPage, allScores]);

  // Reset to first page when package changes
  useEffect(() => {
    setCurrentPage(1);
  }, [packageId]);

  // Compact Pagination Component
  const CompactPagination = () => {
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
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allScores.length)} of {allScores.length} participants
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-400 text-sm">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className="h-8 w-8 p-0 text-sm"
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
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
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🏆 Top Ranking</CardTitle>
              <CardDescription className="text-xs">{packageTitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded border border-gray-200">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-5 w-10" />
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
     

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🏆 Ranking Peserta
          </CardTitle>
          <CardDescription className="text-sm">
            Ranking peserta untuk paket: {packageTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {topScores.map((session, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <div key={session.id} className="flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center gap-2">
                  {getRankIcon(globalIndex)}
                  <div>
                    <p className="font-medium text-gray-900 text-xs">
                      {session.user?.full_name || session.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={getScoreBadgeVariant(session.total_score)} 
                    className="text-xs px-2 py-0.5 font-medium"
                  >
                    {session.total_score}
                  </Badge>
                 
                </div>
              </div>
            );
          })}
          
          {/* Compact Pagination */}
          <CompactPagination />
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageRanking;