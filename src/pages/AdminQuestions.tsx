import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "@/App";
import { Question, QuestionPackage } from "@/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  FileText,
  Clock,
  Target,
  BookOpen
} from "lucide-react";
import QuestionForm from "@/components/QuestionForm";

const AdminQuestions = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { packageId } = useParams();
  
  const [packageData, setPackageData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!user.is_admin) {
      navigate('/dashboard');
      return;
    }
    
    if (packageId) {
      loadData();
    }
  }, [user, packageId, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [pkgResult, questionListResult] = await Promise.all([
        QuestionPackage.get(packageId),
        Question.list()
      ]);
      
      const pkg = pkgResult?.data;
      const questionList = Array.isArray(questionListResult?.data) ? 
        questionListResult.data.filter((q: any) => q.package_id === packageId) : [];
      
      setPackageData(pkg);
      setQuestions(questionList);
      
    } catch (error) {
      console.error('Error loading questions data:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      toast({
        title: "Error",
        description: "Gagal memuat data soal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (formData) => {
    try {
      const newQuestion = await Question.create({
        ...formData,
        package_id: packageId
      });
      
      toast({
        title: "Berhasil",
        description: "Soal berhasil ditambahkan",
      });
      
      setShowAddQuestionDialog(false);
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

  const handleEditQuestion = async (formData) => {
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

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      return;
    }
    
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
  };

  const openAddQuestionDialog = () => {
    setShowAddQuestionDialog(true);
  };

  const openEditQuestionDialog = (question) => {
    setEditingQuestion(question);
    setShowEditQuestionDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data soal...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Paket soal tidak ditemukan</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            Kembali ke Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Soal</h1>
                <p className="text-gray-600">
                  Paket: {packageData.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={openAddQuestionDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Tambah Soal</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Package Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Informasi Paket</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {questions.length}
                </div>
                <div className="text-sm text-gray-600">Total Soal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {questions.filter(q => q.main_category === 'TWK').length}
                </div>
                <div className="text-sm text-gray-600">Soal TWK</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {questions.filter(q => q.main_category === 'TIU').length}
                </div>
                <div className="text-sm text-gray-600">Soal TIU</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {questions.filter(q => q.main_category === 'TKP').length}
                </div>
                <div className="text-sm text-gray-600">Soal TKP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Soal</h2>
            <p className="text-sm text-gray-600 mt-1">
              Kelola soal untuk paket {packageData.title}
            </p>
          </div>
          
          {questions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Soal</h3>
              <p className="text-gray-500 mb-4">
                Mulai tambahkan soal untuk paket ini
              </p>
              <Button onClick={openAddQuestionDialog}>
                Tambah Soal Pertama
              </Button>
            </div>
          ) : (
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
                      Jawaban Benar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Point
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
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {question.question_text?.substring(0, 100)}...
                          </div>
                          {question.question_image_url && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              📷 Ada Gambar
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              question.main_category === 'TWK' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              question.main_category === 'TIU' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                              question.main_category === 'TKP' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                              'border-gray-200 text-gray-700 bg-gray-50'
                            }`}
                          >
                            {question.main_category || 'Non Tag'}
                          </Badge>
                          {question.sub_category && (
                            <span className="text-xs text-gray-500">
                              {question.sub_category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {question.correct_answer}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs space-y-1">
                          <div>A: {question.points_a || 0}</div>
                          <div>B: {question.points_b || 0}</div>
                          <div>C: {question.points_c || 0}</div>
                          <div>D: {question.points_d || 0}</div>
                          <div>E: {question.points_e || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditQuestionDialog(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Soal Baru</DialogTitle>
          </DialogHeader>
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={() => setShowAddQuestionDialog(false)}
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

export default AdminQuestions;
