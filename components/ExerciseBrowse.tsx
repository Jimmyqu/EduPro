import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { apiService } from '@/lib/api';
import type { ApiExamDetail, ExamQuestion } from '@/lib/api';

export default function ExerciseBrowse() {
  const router = useRouter();
  const { id } = router.query;
  
  const [exercise, setExercise] = useState<ApiExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadExerciseDetail();
    }
  }, [id]);

  const loadExerciseDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExerciseBrowse(Number(id));
      if (response.data) {
        setExercise(response.data);
      }
    } catch (err) {
      setError('加载练习详情失败');
      console.error('Error loading exercise detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取题目类型的中文名称
  const getQuestionTypeName = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'true_false': '判断题',
      'short_answer': '简答题',
      'essay': '论述题',
      'fill_blank': '填空题'
    };
    return typeMap[type] || '未知题型';
  };

  // 获取正确答案的显示文本
  const getCorrectAnswerText = (question: ExamQuestion): string => {
    const { question: q } = question;
    
    if (['single_choice', 'true_false'].includes(q.question_type)) {
      // 单选题和判断题
      if (q.options && q.correct_answer) {
        return `${q.correct_answer}. ${q.options[q.correct_answer]}`;
      }
      return q.correct_answer || '无答案';
    } else if (q.question_type === 'multiple_choice') {
      // 多选题
      if (q.options && q.correct_answer) {
        const answers = q.correct_answer.split(',');
        return answers.map(ans => `${ans}. ${q.options![ans]}`).join('; ');
      }
      return q.correct_answer || '无答案';
    } else {
      // 主观题
      return q.correct_answer || '参考答案见解析';
    }
  };

  // 浏览模式不显示用户答案

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">练习不存在</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              {exercise.title} - 浏览模式
            </h1>
            <p className="text-gray-600">{exercise.course.title}</p>
          </div>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <BookOpen className="h-3 w-3 mr-1" />
            浏览模式
          </Badge>
        </div>

        {/* 练习信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              练习信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">题目数量：</span>
                <span className="font-medium">{exercise.questions?.length || 0}</span>
              </div>
              {/* <div>
                <span className="text-gray-600">总分：</span>
                <span className="font-medium">{exercise.total_score}</span>
              </div>
              <div>
                <span className="text-gray-600">及格分：</span>
                <span className="font-medium">{exercise.passing_score}</span>
              </div>
              <div>
                <span className="text-gray-600">建议时长：</span>
                <span className="font-medium">{exercise.duration_minutes} 分钟</span>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* 题目列表 */}
        <div className="space-y-6">
          {exercise.questions?.map((examQuestion, index) => {
            const { question: q } = examQuestion;
            
            return (
              <Card key={q.question_id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      第 {index + 1} 题
                      <Badge variant="outline" className="ml-2">
                        {getQuestionTypeName(q.question_type)}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        {examQuestion.score} 分
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base text-gray-900 mt-2">
                    {q.content}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 选项显示 */}
                  {q.options && Object.keys(q.options).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">选项：</h4>
                      <div className="space-y-2">
                        {Object.entries(q.options).map(([key, value]) => {
                          const isCorrect = q.correct_answer?.includes(key);
                          
                          return (
                            <div 
                              key={key} 
                              className={`flex items-start gap-2 p-2 rounded-md ${
                                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                              }`}
                            >
                              {isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="font-medium">{key}.</span>
                              <span className="flex-1">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* 正确答案 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      正确答案：
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-green-800">{getCorrectAnswerText(examQuestion)}</p>
                    </div>
                  </div>

                  {/* 解析 */}
                  {(q.explanation || q.analysis || q.correct_answer) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        题目解析：
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-blue-800 whitespace-pre-wrap">
                          {q.explanation || q.analysis || `正确答案：${q.correct_answer}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 知识点 */}
                  {q.knowledge_points && q.knowledge_points.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-purple-700">相关知识点：</h4>
                      <div className="flex flex-wrap gap-2">
                        {q.knowledge_points.map((point, idx) => (
                          <Badge key={idx} variant="outline" className="text-purple-700 border-purple-300">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回练习列表
          </Button>
        </div>
      </div>
    </div>
  );
}