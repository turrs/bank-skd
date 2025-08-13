import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Question, UserAnswer, TryoutSession, QuestionPackage } from "@/entities";

const TryoutReviewPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      try {
        // First load session data
        const sessionResult = await TryoutSession.get(sessionId);
        const sessionData = sessionResult?.data;
        setSession(sessionData);
        
        if (sessionData?.package_id) {
          // Then load package and questions using the package_id from session
          const [pkgResult, qs, ansRaw] = await Promise.all([
            QuestionPackage.get(sessionData.package_id),
            Question.list(),
            UserAnswer.list()
          ]);
          
          const pkg = pkgResult?.data;
          setPackageData(pkg);
          
          const qList = Array.isArray(qs?.data) ? qs.data.filter((q: any) => q.package_id === sessionData.package_id) : [];
          const aList = Array.isArray(ansRaw?.data) ? ansRaw.data.filter((a: any) => a.session_id === sessionId) : [];
          setQuestions(qList);
          
          const map: Record<string, any> = {};
          for (const a of aList) {
            map[a.question_id] = a;
          }
          setAnswersByQuestionId(map);
        }
      } catch (e) {
        console.error("Error loading review data:", e);
        console.error("Error details:", {
          message: e?.message,
          stack: e?.stack,
          name: e?.name
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
          <p className="text-center mt-4 text-blue-700 font-medium">Loading Review...</p>
        </div>
      </div>
    );
  }

  if (!session || !packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-blue-700 font-medium">Data tryout tidak ditemukan</p>
            <Link to="/history">
              <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Kembali ke Riwayat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const optionKeys = ['A', 'B', 'C', 'D', 'E'] as const;

  const getPointsForOption = (q: any, option: string) => {
    const key = `points_${option.toLowerCase()}`;
    return Number(q[key] ?? 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getQuestionStatus = (questionId: string) => {
    const answer = answersByQuestionId[questionId];
    if (!answer) return 'unanswered';
    return answer.is_correct ? 'correct' : 'incorrect';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-green-100 text-green-800';
      case 'incorrect': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return '✓';
      case 'incorrect': return '✗';
      default: return '○';
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/history">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Riwayat
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Review Tryout
                </h1>
                <p className="text-blue-700 font-medium">{packageData.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary */}
        <Card className="mb-6 bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
            <CardTitle className="text-blue-900">Ringkasan Tryout</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className={`text-2xl font-bold ${getScoreColor(session.total_score)}`}>
                  {session.total_score}
                </div>
                <div className="text-sm text-blue-700 font-medium">Total Poin</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {session.correct_answers}
                </div>
                <div className="text-sm text-green-700 font-medium">Jawaban Benar</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {session.wrong_answers}
                </div>
                <div className="text-sm text-red-700 font-medium">Jawaban Salah</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">
                  {session.unanswered}
                </div>
                <div className="text-sm text-gray-700 font-medium">Tidak Dijawab</div>
              </div>
            </div>

            {/* Pass/Fail Status */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-semibold mb-2 text-blue-900">Status Kelulusan per Kategori:</h4>
              <div className="flex flex-wrap gap-2">
                {session.passed_twk && <Badge className="bg-green-100 text-green-800 border-green-200">✓ TWK Lulus</Badge>}
                {!session.passed_twk && <Badge variant="destructive" className="border-red-200">✗ TWK Tidak Lulus</Badge>}
                {session.passed_tiu && <Badge className="bg-green-100 text-green-800 border-green-200">✓ TIU Lulus</Badge>}
                {!session.passed_tiu && <Badge variant="destructive" className="border-red-200">✗ TIU Tidak Lulus</Badge>}
                {session.passed_tkp && <Badge className="bg-green-100 text-green-800 border-green-200">✓ TKP Lulus</Badge>}
                {!session.passed_tkp && <Badge variant="destructive" className="border-red-200">✗ TKP Tidak Lulus</Badge>}
                {session.passed_overall && <Badge className="bg-green-100 text-green-800 border-green-200">✓ Overall Lulus</Badge>}
                {!session.passed_overall && <Badge variant="destructive" className="border-red-200">✗ Overall Tidak Lulus</Badge>}
              </div>
            </div>

            {/* Points per Category */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-semibold mb-2 text-blue-900">Poin per Kategori:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  // Calculate points per main category
                  const pointsByCategory: Record<string, number> = {};
                  questions.forEach(q => {
                    const category = q.main_category || 'Non Tag';
                    const answer = answersByQuestionId[q.id];
                    if (answer) {
                      pointsByCategory[category] = (pointsByCategory[category] || 0) + Number(answer.awarded_points || 0);
                    }
                  });

                  const categories = ['TWK', 'TIU', 'TKP', 'Non Tag'];
                  return categories.map(cat => {
                    const points = pointsByCategory[cat] || 0;
                    const threshold = packageData[`threshold_${cat.toLowerCase().replace(' ', '_')}`] || 0;
                    const isPassed = points >= threshold;
                    
                    return (
                      <div key={cat} className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-lg font-bold text-blue-800">{points}</div>
                        <div className="text-xs text-blue-700 font-medium">{cat}</div>
                        <div className="text-xs text-blue-600">Target: {threshold}</div>
                        <div className={`text-xs mt-1 font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                          {isPassed ? '✓ Lulus' : '✗ Tidak Lulus'}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Points per Sub-Category/Material */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-semibold mb-2 text-blue-900">Poin per Sub Kategori/Materi:</h4>
              <div className="space-y-3">
                {(() => {
                  // Calculate points per sub-category
                  const pointsBySubCategory: Record<string, { points: number; mainCategory: string; questionCount: number }> = {};
                  
                  questions.forEach(q => {
                    const subCategory = q.sub_category;
                    const mainCategory = q.main_category || 'Non Tag';
                    
                    // Only process questions that have a sub-category
                    if (subCategory && subCategory.trim() !== '') {
                      const answer = answersByQuestionId[q.id];
                      if (answer) {
                        if (!pointsBySubCategory[subCategory]) {
                          pointsBySubCategory[subCategory] = { points: 0, mainCategory, questionCount: 0 };
                        }
                        pointsBySubCategory[subCategory].points += Number(answer.awarded_points || 0);
                        pointsBySubCategory[subCategory].questionCount += 1;
                      }
                    }
                  });

                  // Sort by main category, then by points
                  const sortedSubCategories = Object.entries(pointsBySubCategory)
                    .sort(([,a], [,b]) => {
                      if (a.mainCategory !== b.mainCategory) {
                        return a.mainCategory.localeCompare(b.mainCategory);
                      }
                      return b.points - a.points;
                    });

                  if (sortedSubCategories.length === 0) {
                    return (
                      <div className="text-center p-4 text-blue-700 font-medium">
                        Tidak ada sub kategori yang tersedia
                      </div>
                    );
                  }

                  return sortedSubCategories.map(([subCategory, data]) => (
                    <div key={subCategory} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{subCategory}</div>
                        <div className="text-sm text-blue-700">
                          {data.mainCategory} • {data.questionCount} soal
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-800">{data.points} poin</div>
                        <div className="text-xs text-blue-600">
                          Rata-rata: {data.questionCount > 0 ? Math.round(data.points / data.questionCount) : 0}/soal
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Review Jawaban
                </h2>
                <div className="text-sm text-blue-700 font-medium">
                  Soal {currentQuestionIndex + 1} dari {questions.length}
                </div>
              </div>
              
              {currentQuestion && (
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                    <CardTitle className="text-base flex items-center justify-between text-blue-900">
                      <span>
                        Soal {currentQuestion.question_number || currentQuestionIndex + 1}
                        {currentQuestion.main_category && (
                          <Badge variant="secondary" className="ml-2">{currentQuestion.main_category}</Badge>
                        )}
                        {currentQuestion.sub_category && (
                          <Badge variant="outline" className="ml-2">{currentQuestion.sub_category}</Badge>
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const ua = answersByQuestionId[currentQuestion.id];
                          const selected = ua?.user_answer;
                          const awarded = Number(ua?.awarded_points ?? 0);
                          const isCorrect = selected === currentQuestion.correct_answer;
                          
                          return (
                            <>
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {typeof awarded === 'number' && !Number.isNaN(awarded) && (
                                <Badge variant="outline">Poin: {awarded}</Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-gray-800 text-lg">{currentQuestion.question_text}</div>

                    {/* Question Metadata */}
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
                      {currentQuestion.main_category && (
                        <Badge variant="secondary">{currentQuestion.main_category}</Badge>
                      )}
                      {currentQuestion.sub_category && (
                        <Badge variant="outline">{currentQuestion.sub_category}</Badge>
                      )}
                      {(() => {
                        const ua = answersByQuestionId[currentQuestion.id];
                        if (ua) {
                          // Try to get answer time from different possible timestamp fields
                          let startTime, endTime;
                          
                          if (ua.created_at && ua.updated_at) {
                            startTime = new Date(ua.created_at);
                            endTime = new Date(ua.updated_at);
                          } else if (ua.created_at) {
                            // If only created_at exists, use it as both start and end
                            startTime = new Date(ua.created_at);
                            endTime = new Date(ua.created_at);
                          }
                          
                          if (startTime && endTime) {
                            const timeDiff = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
                            
                            // Only show if there's a meaningful time difference
                            if (timeDiff >= 0) {
                              return (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  ⏱️ {timeDiff} detik
                                </Badge>
                              );
                            }
                          }
                          
                          // Fallback: show that time data is not available
                          return (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">
                              ⏱️ Waktu tidak tersedia
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="space-y-2">
                      {optionKeys.map((opt) => {
                        const text = currentQuestion[`option_${opt.toLowerCase()}`];
                        const points = getPointsForOption(currentQuestion, opt);
                        const ua = answersByQuestionId[currentQuestion.id];
                        const selected = ua?.user_answer;
                        const isSelected = selected === opt;
                        const isCorrect = currentQuestion.correct_answer === opt;
                        
                        return (
                          <div
                            key={opt}
                            className={`p-3 border rounded-lg flex items-start justify-between ${
                              isSelected 
                                ? isCorrect 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-red-500 bg-red-50'
                                : isCorrect 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                isSelected 
                                  ? isCorrect 
                                    ? 'border-green-500 bg-green-500 text-white' 
                                    : 'border-red-500 bg-red-500 text-white'
                                  : isCorrect 
                                    ? 'border-green-500 bg-green-500 text-white' 
                                    : 'border-gray-300'
                              }`}>
                                {opt}
                              </div>
                              <div className="text-gray-800">
                                <div>{text}</div>
                                <div className="text-xs text-gray-500 mt-1">Poin opsi: {points}</div>
                              </div>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              {isCorrect && <Badge className="bg-green-100 text-green-800">Kunci</Badge>}
                              {isSelected && (
                                <Badge variant={isCorrect ? "default" : "destructive"}>
                                  {isCorrect ? "Benar" : "Salah"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {currentQuestion.explanation && (
                      <div className="p-4 bg-blue-50 rounded border border-blue-200">
                        <div className="text-sm font-semibold mb-2 text-blue-800">Penjelasan Jawaban</div>
                        <div className="text-sm text-blue-700 whitespace-pre-wrap">{currentQuestion.explanation}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  ← Sebelumnya
                </Button>
                
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Selanjutnya →
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-white/80 backdrop-blur-md border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                <CardTitle className="text-sm text-blue-900">Navigasi Soal</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id);
                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={
                          index === currentQuestionIndex ? "default" : "outline"
                        }
                        className={`w-8 h-8 p-0 relative ${
                          index === currentQuestionIndex ? "" : getQuestionStatusColor(status)
                        }`}
                        onClick={() => setCurrentQuestionIndex(index)}
                        title={`Soal ${index + 1} - ${status === 'correct' ? 'Benar' : status === 'incorrect' ? 'Salah' : 'Tidak Dijawab'}`}
                      >
                        <span className="text-xs">
                          {index + 1}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="text-xs text-blue-700 mb-2 font-medium">Legenda:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs">1</div>
                      <span className="text-blue-700">Benar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs">2</div>
                      <span className="text-blue-700">Salah</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center text-xs">3</div>
                      <span className="text-blue-700">Tidak Dijawab</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryoutReviewPage;
