import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, ArrowLeft, ArrowRight, Flag, ChevronLeft, ChevronRight, CheckCircle, Eye, EyeOff, MoreHorizontal, BookOpen, BarChart3 } from "lucide-react";
import { QuestionPackage, Question, TryoutSession, UserAnswer, QuestionTagStats } from "@/entities";
import { toast } from "@/hooks/use-toast";
import { UserContext } from "@/App";

const TryoutPage = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [packageData, setPackageData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState({});
  const intervalRef = useRef(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Added sessionId state
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  useEffect(() => {
    initializeTryout();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [packageId]);

  useEffect(() => {
    if (timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const initializeTryout = async () => {
    try {
      const [pkgResult, questionResult] = await Promise.all([
        QuestionPackage.get(packageId),
        Question.list()
      ]);
      
      const pkg = pkgResult?.data;
      const questionList = questionResult?.data?.filter((q: any) => q.package_id === packageId) || [];
      
      if (!pkg) {
        throw new Error('Package tidak ditemukan');
      }
      
      setPackageData(pkg);
      setQuestions(questionList as any[]);
      
      // Resume existing session if any, otherwise create a new one
      if (!user) throw new Error('User not found');

      const sessionsResult = await TryoutSession.list();
      const existingSessions = sessionsResult?.data?.filter((session: any) => 
        session.user_id === user.id && 
        session.package_id === packageId && 
        session.status === 'in_progress'
      ) || [];

      if (Array.isArray(existingSessions) && existingSessions.length > 0) {
        const existing = existingSessions[0];
        setSession(existing);
        console.log('🔄 Resuming existing session:', existing.id);
        setSessionId(existing.id); // Set sessionId

        // Prefill answers from DB
        try {
          const uaResult = await UserAnswer.list();
          const uaList = uaResult?.data?.filter((ua: any) => ua.session_id === existing.id) || [];
          const ansMap = {} as Record<string, string>;
          (uaList || []).forEach((ua: any) => {
            if (ua.question_id && ua.user_answer) ansMap[ua.question_id] = ua.user_answer;
          });
          setAnswers(ansMap);

          // Set current index to first unanswered question
          const firstUnansweredIndex = (questionList as any[]).findIndex((q: any) => !ansMap[q.id]);
          setCurrentQuestionIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);
        } catch (_) {
          // ignore answers prefill error
        }

        // Compute remaining time from start_time
        const startedAtMs = existing.start_time ? new Date(existing.start_time).getTime() : Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        const remaining = pkg.duration_minutes * 60 - elapsedSeconds;
        setTimeLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          // Time already up, finish immediately
          handleTimeUp();
        }
      } else {
        const newSessionResult = await TryoutSession.create({
          user_id: user.id,
          package_id: packageId,
          start_time: new Date().toISOString(),
          status: 'in_progress'
        });
        
        if (newSessionResult?.data?.[0]) {
          const newSession = newSessionResult.data[0];
          setSession(newSession);
          console.log('🆕 Created new session:', newSession.id);
          setSessionId(newSession.id); // Set sessionId
          setTimeLeft(pkg.duration_minutes * 60); // Convert to seconds
        } else {
          throw new Error('Failed to create new session');
        }
      }
      
    } catch (error) {
      console.error("Error initializing tryout:", error);
      toast({
        title: "Error",
        description: "Gagal memulai tryout",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menyimpan jawaban ke database
  const saveAnswerToDatabase = async (answer: string, questionIndex: number) => {
    try {
      console.log('🔍 Debug saveAnswerToDatabase:', {
        user: !!user,
        sessionId,
        answer,
        questionIndex,
        questionsLength: questions.length
      });
      
      if (!user || !sessionId) {
        console.error('❌ Missing required data for saving answer:', { user: !!user, sessionId });
        return;
      }
      
      const question = questions[questionIndex];
      if (!question) {
        console.error('Question not found for index:', questionIndex);
        return;
      }
      
      console.log(`💾 Saving answer for question ${questionIndex + 1}:`, answer);
      
      // Hitung point yang didapat
      const answerKey = `points_${answer.toLowerCase()}`;
      const awardedPoints = question[answerKey] || 0;
      
      // Hitung waktu yang dihabiskan untuk soal ini
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      
      // Cek apakah sudah ada jawaban sebelumnya
      console.log('🔍 Checking existing answers for session:', sessionId, 'question:', question.id);
      const existingAnswersResult = await UserAnswer.list();
      console.log('📊 UserAnswer.list() result:', existingAnswersResult);
      
      const existingAnswers = existingAnswersResult?.data?.filter((a: any) => 
        a.session_id === sessionId && a.question_id === question.id
      ) || [];
      
      console.log('🔍 Filtered existing answers:', existingAnswers);
      
      if (existingAnswers && existingAnswers.length > 0) {
        // Update jawaban yang sudah ada
        const existingAnswer = existingAnswers[0];
        const updateResult = await UserAnswer.update(existingAnswer.id, {
          user_answer: answer,
          awarded_points: awardedPoints,
          is_correct: answer === question.correct_answer,
          time_spent_seconds: timeSpent
        });
        
        if (updateResult?.data) {
          console.log('✅ Answer updated in database:', existingAnswer.id);
        } else {
          console.error('❌ Failed to update answer:', updateResult);
        }
      } else {
        // Buat jawaban baru
        const newAnswerResult = await UserAnswer.create({
          session_id: sessionId,
          question_id: question.id,
          user_answer: answer,
          awarded_points: awardedPoints,
          is_correct: answer === question.correct_answer,
          time_spent_seconds: timeSpent
        });
        
        if (newAnswerResult?.data?.[0]) {
          console.log('✅ New answer created in database:', newAnswerResult.data[0].id);
        } else {
          console.error('❌ Failed to create answer:', newAnswerResult);
        }
      }
      
      // Update local state
      setUserAnswers(prev => ({
        ...prev,
        [questionIndex]: answer
      }));
      
      // Reset question start time untuk soal berikutnya
      setQuestionStartTime(Date.now());
      
    } catch (error) {
      console.error('❌ Error in saveAnswerToDatabase:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jawaban. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  // Fungsi untuk load jawaban yang sudah ada dari database
  const loadExistingAnswers = async () => {
    try {
      if (!sessionId) return;
      
      console.log('🔄 Loading existing answers for session:', sessionId);
      
      const existingAnswersResult = await UserAnswer.list();
      const existingAnswers = existingAnswersResult?.data?.filter((a: any) => 
        a.session_id === sessionId
      ) || [];
      
      console.log('📊 Found existing answers:', existingAnswers.length);
      
      if (existingAnswers && existingAnswers.length > 0) {
        const answersMap: Record<number, string> = {};
        
        existingAnswers.forEach((answer: any) => {
          // Cari index soal berdasarkan question_id
          const questionIndex = questions.findIndex((q: any) => q.id === answer.question_id);
          if (questionIndex !== -1) {
            answersMap[questionIndex] = answer.user_answer;
            console.log(`📝 Question ${questionIndex + 1}: ${answer.user_answer}`);
          }
        });
        
        setUserAnswers(answersMap);
        console.log('✅ Loaded existing answers:', answersMap);
        
        // Update progress display
        const answeredCount = Object.keys(answersMap).length;
        console.log(`📊 Progress: ${answeredCount}/${questions.length} questions answered`);
      } else {
        console.log('ℹ️ No existing answers found');
      }
      
    } catch (error) {
      console.error('❌ Error loading existing answers:', error);
      toast({
        title: "Warning",
        description: "Gagal memuat jawaban sebelumnya. Tryout akan dimulai dari awal.",
        variant: "destructive",
      });
    }
  };

  // Load existing answers saat questions dan sessionId tersedia
  useEffect(() => {
    if (questions.length > 0 && sessionId) {
      loadExistingAnswers();
    }
  }, [questions, sessionId]);

  // Update isAnswered state berdasarkan userAnswers
  useEffect(() => {
    if (currentQuestionIndex !== null && userAnswers[currentQuestionIndex] !== undefined) {
      setIsAnswered(true);
    } else {
      setIsAnswered(false);
    }
  }, [currentQuestionIndex, userAnswers]);

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

  const calculateTagStats = async (userAnswers) => {
    const tagStats = {};
    
    // Group questions by main and sub category
    questions.forEach(question => {
      const mainCat = question.main_category || 'Non Tag';
      const subCat = question.sub_category || 'Umum';
      const key = `${mainCat}|${subCat}`;
      
      if (!tagStats[key]) {
        tagStats[key] = {
          main_category: mainCat,
          sub_category: subCat,
          total_questions: 0,
          correct_answers: 0,
          wrong_answers: 0,
          unanswered: 0,
          total_time_seconds: 0
        };
      }
      tagStats[key].total_questions++;
    });

    // Calculate stats for each category combination
    userAnswers.forEach(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      if (question) {
        const mainCat = question.main_category || 'Non Tag';
        const subCat = question.sub_category || 'Umum';
        const key = `${mainCat}|${subCat}`;
        
        if (answer.is_correct) {
          tagStats[key].correct_answers++;
        } else if (answer.user_answer) {
          tagStats[key].wrong_answers++;
        } else {
          tagStats[key].unanswered++;
        }
        
        tagStats[key].total_time_seconds += answer.time_spent_seconds || 0;
        tagStats[key].total_points = (tagStats[key].total_points || 0) + Number(answer.awarded_points || 0);
      }
    });

    // Save tag stats to database
    for (const [key, stats] of Object.entries(tagStats)) {
      try {
        await QuestionTagStats.create({
          session_id: session.id,
          user_id: user.id,
          package_id: packageId,
          main_category: (stats as any).main_category,
          sub_category: (stats as any).sub_category,
          total_questions: (stats as any).total_questions,
          correct_answers: (stats as any).correct_answers,
          wrong_answers: (stats as any).wrong_answers,
          unanswered: (stats as any).unanswered,
          total_time_seconds: (stats as any).total_time_seconds,
          average_time_seconds: (stats as any).total_questions > 0 ? Math.round((stats as any).total_time_seconds / (stats as any).total_questions) : 0,
          total_points: (stats as any).total_points || 0
        });
      } catch (error) {
        console.error(`Error saving tag stats for ${key}:`, error);
      }
    }
  };

  const handleFinishTryout = async () => {
    try {
      setIsCalculatingScore(true);
      setShowFinishConfirmation(false);
      
      // Hitung total score dari database
      let totalScore = 0;
      let pointsByMainCategory = { TWK: 0, TIU: 0, TKP: 0 };
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;
      
      // Ambil semua jawaban dari database untuk session ini
      const allAnswersResult = await UserAnswer.list();
      const allAnswers = allAnswersResult?.data?.filter((a: any) => 
        a.session_id === sessionId
      ) || [];
      
      console.log('All answers from database:', allAnswers);
      
      // Hitung score berdasarkan jawaban di database
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const dbAnswer = allAnswers.find(a => a.question_id === question.id);
        
        if (dbAnswer && dbAnswer.user_answer) {
          const earnedPoints = dbAnswer.awarded_points || 0;
          totalScore += earnedPoints;
          
          if (dbAnswer.is_correct) {
            correctAnswers++;
          } else {
            wrongAnswers++;
          }
          
          // Tambahkan ke kategori utama
          if (question.main_category && pointsByMainCategory.hasOwnProperty(question.main_category)) {
            pointsByMainCategory[question.main_category] += earnedPoints;
          }
        } else {
          unanswered++;
        }
      }
      
      console.log('Final calculation:', {
        totalScore,
        pointsByMainCategory,
        correctAnswers,
        wrongAnswers,
        unanswered
      });
      
      // Update session status
      if (sessionId) {
        await TryoutSession.update(sessionId, {
          status: 'completed',
          end_time: new Date().toISOString(),
          total_score: totalScore,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          unanswered: unanswered
        });
      }
      
      // Hitung pass/fail berdasarkan threshold
      const thresholds = packageData?.thresholds || {};
      const passedTWK = pointsByMainCategory.TWK >= (thresholds.threshold_twk || 0);
      const passedTIU = pointsByMainCategory.TIU >= (thresholds.threshold_tiu || 0);
      const passedTKP = pointsByMainCategory.TKP >= (thresholds.threshold_tkp || 0);
      const passedOverall = passedTWK && passedTIU && passedTKP;
      
      // Update session dengan pass/fail status
      if (sessionId) {
        await TryoutSession.update(sessionId, {
          passed_twk: passedTWK,
          passed_tiu: passedTIU,
          passed_tkp: passedTKP,
          passed_overall: passedOverall
        });
      }
      
      // GENERATE DAN SIMPAN QUESTION_TAG_STATS
      await generateAndSaveQuestionTagStats();
      
      // Tampilkan hasil
      setShowResultDialog(true);
      setResultData({
        totalScore,
        pointsByMainCategory,
        thresholds: {
          threshold_twk: thresholds.threshold_twk || 0,
          threshold_tiu: thresholds.threshold_tiu || 0,
          threshold_tkp: thresholds.threshold_tkp || 0
        },
        pass: passedOverall,
        correctAnswers,
        wrongAnswers,
        unanswered
      });
      
    } catch (error) {
      console.error('Error finishing tryout:', error);
      toast({
        title: "Error",
        description: "Gagal menyelesaikan tryout",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Fungsi untuk generate dan simpan question_tag_stats
  const generateAndSaveQuestionTagStats = async () => {
    try {
      if (!sessionId || !user || !packageId) {
        console.error('Missing required data for generating tag stats');
        return;
      }

      console.log('Generating question tag stats...'); // Debug
      
      // Ambil semua jawaban untuk session ini
      const allAnswersResult = await UserAnswer.list();
      const allAnswers = allAnswersResult?.data?.filter((a: any) => 
        a.session_id === sessionId
      ) || [];
      
      // Group questions by main_category dan sub_category
      const categoryStats = {};
      
      questions.forEach((question) => {
        const mainCategory = question.main_category || 'Non Tag';
        const subCategory = question.sub_category || 'Umum';
        const key = `${mainCategory}-${subCategory}`;
        
        if (!categoryStats[key]) {
          categoryStats[key] = {
            main_category: mainCategory,
            sub_category: subCategory,
            total_questions: 0,
            correct_answers: 0,
            wrong_answers: 0,
            unanswered: 0,
            total_points: 0,
            total_time_seconds: 0
          };
        }
        
        categoryStats[key].total_questions++;
        
        // Cari jawaban user untuk soal ini
        const userAnswer = allAnswers.find(a => a.question_id === question.id);
        
        if (userAnswer && userAnswer.user_answer) {
          if (userAnswer.is_correct) {
            categoryStats[key].correct_answers++;
          } else {
            categoryStats[key].wrong_answers++;
          }
          categoryStats[key].total_points += userAnswer.awarded_points || 0;
          categoryStats[key].total_time_seconds += userAnswer.time_spent_seconds || 0;
        } else {
          categoryStats[key].unanswered++;
        }
      });
      
      console.log('Category stats calculated:', categoryStats); // Debug
      
      // Simpan setiap statistik kategori ke database
      for (const [key, stats] of Object.entries(categoryStats)) {
        try {
          // Cek apakah sudah ada statistik untuk kategori ini
          const existingStatsResult = await QuestionTagStats.list();
          const existingStats = existingStatsResult?.data?.filter((s: any) => 
            s.session_id === sessionId &&
            s.user_id === user.id &&
            s.package_id === packageId &&
            s.main_category === stats.main_category &&
            s.sub_category === stats.sub_category
          ) || [];
          
          if (existingStats && existingStats.length > 0) {
            // Update statistik yang sudah ada
            await QuestionTagStats.update(existingStats[0].id, {
              total_questions: stats.total_questions,
              correct_answers: stats.correct_answers,
              wrong_answers: stats.wrong_answers,
              unanswered: stats.unanswered,
              total_points: stats.total_points,
              total_time_seconds: stats.total_time_seconds,
              average_time_seconds: stats.total_questions > 0 
                ? Math.round(stats.total_time_seconds / stats.total_questions)
                : 0
            });
            
            console.log(`Updated stats for ${key}`); // Debug
          } else {
            // Buat statistik baru
            await QuestionTagStats.create({
              session_id: sessionId,
              user_id: user.id,
              package_id: packageId,
              main_category: stats.main_category,
              sub_category: stats.sub_category,
              total_questions: stats.total_questions,
              correct_answers: stats.correct_answers,
              wrong_answers: stats.wrong_answers,
              unanswered: stats.unanswered,
              total_points: stats.total_points,
              total_time_seconds: stats.total_time_seconds,
              average_time_seconds: stats.total_questions > 0 
                ? Math.round(stats.total_time_seconds / stats.total_questions)
                : 0
            });
            
            console.log(`Created new stats for ${key}`); // Debug
          }
        } catch (error) {
          console.error(`Error saving stats for ${key}:`, error);
        }
      }
      
      console.log('Question tag stats saved successfully!'); // Debug
      
    } catch (error) {
      console.error('Error generating question tag stats:', error);
    }
  };

  const handleTimeUp = async () => {
    toast({
      title: "Waktu habis",
      description: "Tryout akan diselesaikan otomatis",
      variant: "destructive",
    });
    
    setTimeout(() => {
      handleFinishTryout();
    }, 2000);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Fungsi untuk menghitung progress berdasarkan userAnswers local
  const getAnsweredCount = () => {
    return Object.keys(userAnswers).filter(key => 
      userAnswers[key] !== null && 
      userAnswers[key] !== undefined && 
      userAnswers[key] !== ''
    ).length;
  };



  // Perbaiki fungsi handleAnswerSelect
  const handleAnswerSelect = async (answer) => {
    try {
      console.log('Selecting answer:', answer, 'for question:', currentQuestionIndex);
      
      // Update local state terlebih dahulu untuk UI yang responsive
      const newUserAnswers = { ...userAnswers };
      newUserAnswers[currentQuestionIndex] = answer;
      setUserAnswers(newUserAnswers);
      
      // Simpan jawaban ke database
      await saveAnswerToDatabase(answer, currentQuestionIndex);
      

      
      console.log('Answer saved successfully:', answer);
      
    } catch (error) {
      console.error('Error saving answer:', error);
      
      // Jika gagal save ke database, rollback local state
      const newUserAnswers = { ...userAnswers };
      delete newUserAnswers[currentQuestionIndex];
      setUserAnswers(newUserAnswers);
      
      toast({
        title: "Error",
        description: "Gagal menyimpan jawaban",
        variant: "destructive",
      });
    }
  };

  // Update result dialog untuk handle close dan redirect
  const handleCloseResultDialog = () => {
    setShowResultDialog(false);
    setResultData(null);
    
    // Redirect ke dashboard setelah menutup popup hasil
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!packageData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Paket soal tidak ditemukan atau belum ada soal</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header sengaja disembunyikan untuk tampilan yang lebih rapi */}
      <header className="hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">{packageData.title}</h1>
              <Badge variant="secondary">
                Soal {currentQuestionIndex + 1} dari {questions.length}
              </Badge>
              {currentQuestion.main_category && (
                <Badge variant="outline">
                  {currentQuestion.main_category}
                </Badge>
              )}
              {currentQuestion.sub_category && (
                <Badge variant="outline" className="bg-blue-50">
                  {currentQuestion.sub_category}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-orange-600">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono font-bold text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <Button 
                variant="destructive" 
                onClick={() => setShowFinishConfirmation(true)}
                disabled={isCalculatingScore}
              >
                <Flag className="w-4 h-4 mr-2" />
                {isCalculatingScore ? 'Menghitung...' : 'Selesai'}
              </Button>
            </div>
          </div>
          
          <div className="pb-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Terjawab: {getAnsweredCount()}/{questions.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar Kiri */}
        <div className={`bg-white shadow-lg border-r transition-all duration-300 ease-in-out transform ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } hidden lg:block`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} title="Kembali">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="text-sm text-gray-500">Tryout</div>
                <div className="font-semibold">{packageData.title}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{getAnsweredCount()}/{questions.length}</span>
            </div>
            <Progress value={(getAnsweredCount() / Math.max(1, questions.length)) * 100} className="mt-2 h-2" />
          </div>

          <Card className="sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daftar Soal</CardTitle>
              <div className="text-xs text-gray-500">Nomor Soal</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = userAnswers[index] !== null && userAnswers[index] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <Button
                      key={index}
                      size="sm"
                      variant={isCurrent ? "default" : "outline"}
                      className={`w-10 h-10 p-0 rounded-md ${
                        isCurrent ? 'ring-2 ring-offset-1 ring-blue-600' : ''
                      } ${
                        isAnswered && !isCurrent ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' : ''
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                      title={`${question.main_category || 'Non Tag'} - ${question.sub_category || 'Umum'}`}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Timer Card */}
          <div className="bg-white shadow-sm border-b p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold">Waktu Tersisa:</span>
                <span className={`text-xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Question Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentQuestion && (
              <div className="max-w-4xl mx-auto">
                {/* Question Card */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Soal {currentQuestionIndex + 1} dari {questions.length}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Kategori: {currentQuestion.main_category} - {currentQuestion.sub_category}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {currentQuestion.difficulty_level === 'easy' ? 'Mudah' : 
                         currentQuestion.difficulty_level === 'medium' ? 'Sedang' : 'Sulit'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pertanyaan */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Pertanyaan:</h3>
                      <div className="text-gray-700 leading-relaxed">
                        {currentQuestion.question_text}
                      </div>
                      
                      {/* Gambar Pertanyaan */}
                      {currentQuestion.question_image_url && (
                        <div className="mt-4">
                          <img 
                            src={currentQuestion.question_image_url} 
                            alt="Gambar Pertanyaan"
                            className="max-w-full h-auto max-h-96 object-contain rounded-lg border shadow-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pilihan Jawaban */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Pilihan Jawaban:</h3>
                      {['A', 'B', 'C', 'D', 'E'].map((option) => {
                        const optionKey = `option_${option.toLowerCase()}`;
                        const isSelected = userAnswers[currentQuestionIndex] === option;
                        const isAnswered = userAnswers[currentQuestionIndex] !== null && userAnswers[currentQuestionIndex] !== undefined;
                        
                        return (
                          <div key={option} className="relative">
                            <button
                              type="button"
                              onClick={() => handleAnswerSelect(option)}
                              disabled={false}
                              className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600'
                                }`}>
                                  {option}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-gray-900 leading-relaxed">
                                    {currentQuestion[optionKey]}
                                  </div>
                                  
                                  {/* Gambar Pilihan Jawaban */}
                                  {currentQuestion[`${optionKey}_image_url`] && (
                                    <div className="mt-3">
                                      <img 
                                        src={currentQuestion[`${optionKey}_image_url`]} 
                                        alt={`Gambar Pilihan ${option}`}
                                        className="max-w-full h-auto max-h-48 object-contain rounded border"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hapus bagian penjelasan jawaban */}
                    {/* Penjelasan tidak ditampilkan saat tryout */}

                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowFinishConfirmation(true)}
                      variant="destructive"
                      className="flex items-center space-x-2"
                      disabled={isCalculatingScore}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{isCalculatingScore ? 'Menghitung...' : 'Selesai Tryout'}</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finish Confirmation Dialog */}
      <Dialog open={showFinishConfirmation} onOpenChange={setShowFinishConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-red-600">
              Konfirmasi Selesai Tryout
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            <div className="text-gray-700">
              <p className="mb-2">Apakah Anda yakin ingin menyelesaikan tryout?</p>
              <p className="text-sm text-gray-600">
                Setelah selesai, Anda tidak dapat mengubah jawaban lagi.
              </p>
            </div>
            
            <div className="flex justify-center space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowFinishConfirmation(false)}
                disabled={isCalculatingScore}
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFinishTryout}
                disabled={isCalculatingScore}
              >
                {isCalculatingScore ? 'Menghitung...' : 'Ya, Selesai'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Dialog for Score Calculation */}
      <Dialog open={isCalculatingScore} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-blue-600">
              Menghitung Nilai
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <div className="text-gray-700">
              <p>Mohon tunggu, sedang menghitung nilai tryout Anda...</p>
              <p className="text-sm text-gray-600 mt-2">
                Ini mungkin memakan waktu beberapa detik.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      {showResultDialog && resultData && (
        <Dialog open={showResultDialog} onOpenChange={handleCloseResultDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold">
                Hasil Tryout
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Total Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {resultData.totalScore}
                </div>
                <div className="text-lg text-gray-600">Total Nilai</div>
              </div>

              {/* Points by Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(resultData.pointsByMainCategory).map(([category, points]) => (
                  <div key={category} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {points}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{category}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      points >= (resultData.thresholds[`threshold_${category.toLowerCase()}`] || 0)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {points >= (resultData.thresholds[`threshold_${category.toLowerCase()}`] || 0) ? 'LULUS' : 'TIDAK LULUS'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Result */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-lg font-semibold ${
                  resultData.pass ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resultData.pass ? '🎉 SELAMAT! ANDA LULUS' : '❌ MOHON MAAF, ANDA TIDAK LULUS'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {resultData.correctAnswers} benar, {resultData.wrongAnswers} salah, {resultData.unanswered} tidak dijawab
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4">
                <Button 
                  onClick={handleCloseResultDialog}
                  className="px-8"
                >
                  Kembali ke Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TryoutPage;