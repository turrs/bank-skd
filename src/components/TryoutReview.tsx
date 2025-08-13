import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Question, UserAnswer } from "@/entities";

type TryoutReviewProps = {
  sessionId: string;
  packageId: string;
};

type QuestionItem = any;
type UserAnswerItem = any;

const TryoutReview = ({ sessionId, packageId }: TryoutReviewProps) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, UserAnswerItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [qs, ansRaw] = await Promise.all([
                      Question.list(),
          UserAnswer.list()
        ]);
        const qList = Array.isArray(qs?.data) ? qs.data.filter((q: any) => q.package_id === packageId) : [];
        const aList = Array.isArray(ansRaw?.data) ? ansRaw.data.filter((a: any) => a.session_id === sessionId) : [];
        setQuestions(qList);
        const map: Record<string, UserAnswerItem> = {};
        for (const a of aList) {
          map[a.question_id] = a;
        }
        setAnswersByQuestionId(map);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    if (sessionId && packageId) loadData();
  }, [sessionId, packageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Tidak ada soal untuk ditampilkan</p>
        </CardContent>
      </Card>
    );
  }

  const optionKeys = ['A','B','C','D','E'] as const;

  const getPointsForOption = (q: any, option: string) => {
    const key = `points_${option.toLowerCase()}`;
    return Number(q[key] ?? 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Jawaban</h3>
      {questions.map((q, idx) => {
        const ua = answersByQuestionId[q.id];
        const selected = ua?.user_answer as string | undefined;
        const awarded = Number(ua?.awarded_points ?? 0);
        return (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  Soal {q.question_number || idx + 1}
                  {q.main_category && (
                    <Badge variant="secondary" className="ml-2">{q.main_category}</Badge>
                  )}
                  {q.sub_category && (
                    <Badge variant="outline" className="ml-2">{q.sub_category}</Badge>
                  )}
                </span>
                {typeof awarded === 'number' && !Number.isNaN(awarded) && (
                  <Badge variant="outline">Poin didapat: {awarded}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-800">{q.question_text}</div>

              <div className="space-y-2">
                {optionKeys.map((opt) => {
                  const text = q[`option_${opt.toLowerCase()}`];
                  const points = getPointsForOption(q, opt);
                  const isSelected = selected === opt;
                  const isCorrect = q.correct_answer === opt;
                  return (
                    <div
                      key={opt}
                      className={`p-3 border rounded-lg flex items-start justify-between ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'
                        }`}>
                          {opt}
                        </div>
                        <div className="text-gray-800">
                          <div>{text}</div>
                          <div className="text-xs text-gray-500 mt-1">Poin opsi: {points}</div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isCorrect && <Badge variant="outline">Kunci</Badge>}
                        {isSelected && <Badge variant="secondary" className="ml-2">Dipilih</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-sm font-semibold mb-1">Penjelasan</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{q.explanation}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TryoutReview;


