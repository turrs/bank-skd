import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingUp, BarChart3 } from "lucide-react";
import { QuestionTagStats } from "@/entities";

const TagStatsView = ({ sessionId }) => {
  const [tagStats, setTagStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadTagStats();
    }
  }, [sessionId]);

  const loadTagStats = async () => {
    try {
      const statsResult = await QuestionTagStats.list();
      const stats = Array.isArray(statsResult?.data) ? 
        statsResult.data.filter((s: any) => s.session_id === sessionId) : [];
      setTagStats(stats);
    } catch (error) {
      console.error("Error loading tag stats:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (mainCategory) => {
    switch (mainCategory) {
      case 'TWK':
        return 'bg-blue-100 text-blue-800';
      case 'TIU':
        return 'bg-green-100 text-green-800';
      case 'TKP':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tagStats.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Tidak ada data statistik per kategori</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Statistik per Kategori Soal
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tagStats.map((stat) => {
          const accuracy = stat.total_questions > 0 
            ? Math.round((stat.correct_answers / stat.total_questions) * 100)
            : 0;
          
          return (
            <Card key={stat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(stat.main_category)}>
                        {stat.main_category}
                      </Badge>
                      <Badge variant="outline">{stat.total_questions} soal</Badge>
                    </div>
                    {stat.sub_category && (
                      <CardTitle className="text-sm text-gray-600">
                        {stat.sub_category}
                      </CardTitle>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Accuracy */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Akurasi</span>
                    <span className={`font-bold ${getAccuracyColor(accuracy)}`}>
                      {accuracy}%
                    </span>
                  </div>
                  <Progress value={accuracy} className="h-2" />
                </div>

                {/* Answer breakdown */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">{stat.correct_answers}</div>
                    <div className="text-gray-600">Benar</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-600">{stat.wrong_answers}</div>
                    <div className="text-gray-600">Salah</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-gray-600">{stat.unanswered}</div>
                    <div className="text-gray-600">Kosong</div>
                  </div>
                </div>

                {/* Points and time stats */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-600">
                    <Target className="w-4 h-4 mr-1" />
                    <span>Total poin:</span>
                  </div>
                  <span className="font-medium">
                    {Number(stat.total_points || 0)}
                  </span>
                </div>

                {/* Time stats */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Rata-rata waktu:</span>
                  </div>
                  <span className="font-medium">
                    {formatTime(stat.average_time_seconds)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-600">
                    <Target className="w-4 h-4 mr-1" />
                    <span>Total waktu:</span>
                  </div>
                  <span className="font-medium">
                    {formatTime(stat.total_time_seconds)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TagStatsView;