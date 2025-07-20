import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { SubmitResult, ApiExamDetail } from '@/lib/api';

interface ExerciseResultProps {
  submitResult: SubmitResult;
  exercise: ApiExamDetail;
  onRetry: () => void;
  mode?: 'normal' | 'wrong-questions'; // 添加模式参数，默认为普通模式
}

export default function ExerciseResult({ submitResult, exercise, onRetry, mode = 'normal' }: ExerciseResultProps) {
  const router = useRouter();
  
  // 创建题目ID到原始顺序的映射
  const questionOrderMap = new Map<number, number>();
  submitResult.question_results.forEach((result, index) => {
    questionOrderMap.set(result.question_id, index + 1);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 结果标题 */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {submitResult.pass_status ? (
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            ) : (
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {submitResult.pass_status ? '练习完成！' : '继续努力！'}
          </h1>
          <p className="text-gray-600">您的答题结果如下</p>
        </div>
        
        {/* 成绩总结 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>成绩总结</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{submitResult.summary.correct_count}</div>
                <div className="text-sm text-gray-600">答对题数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{submitResult.summary.accuracy_rate}%</div>
                <div className="text-sm text-gray-600">正确率</div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        

        {/* 全部题目详细结果 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>题目详情</CardTitle>
            <CardDescription>
              {mode === 'wrong-questions' 
                ? "查看错误题目的答题情况和解析" 
                : "查看所有题目的答题情况和解析"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {submitResult.question_results
                // 如果是错题练习模式，只显示错误的题目
                .filter(result => mode === 'wrong-questions' ? !result.is_correct : true)
                .map((result, index) => (
                <div 
                  key={result.question_id}
                  className={`border rounded-lg p-4 ${
                    result.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* 题目标题 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={result.is_correct ? "default" : "destructive"} className={result.is_correct ? "bg-green-600" : ""}>
                        {result.is_correct ? "正确" : "错误"}
                      </Badge>
                      <span className="font-medium">第 {questionOrderMap.get(result.question_id) || index + 1} 题</span>
                      <span className={`text-sm font-medium ${
                        result.is_correct ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.score_awarded}/{result.total_score}分
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{result.question_content}</p>
                  </div>
                  
                  {/* 选项显示 */}
                  {result.options && (
                    <div className="mb-4 space-y-2">
                      <h4 className="font-medium text-gray-700">选项：</h4>
                      <div className="space-y-1">
                        {Object.entries(result.options).map(([key, value]) => {
                          const isCorrect = result.correct_answer.includes(key);
                          const isUserChoice = result.student_answer.includes(key);
                          
                          return (
                            <div 
                              key={key} 
                              className={`flex items-start gap-2 p-2 rounded ${
                                isCorrect 
                                  ? 'bg-green-100 border border-green-200' 
                                  : isUserChoice && !isCorrect
                                  ? 'bg-red-100 border border-red-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              {isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              )}
                              {isUserChoice && !isCorrect && (
                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="font-medium">{key}.</span>
                              <span className="flex-1">{value}</span>
                              {isCorrect && (
                                <span className="text-xs text-green-600 font-medium">正确答案</span>
                              )}
                              {isUserChoice && !isCorrect && (
                                <span className="text-xs text-red-600 font-medium">您的选择</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 答案对比 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-gray-600">您的答案: </span>
                      <span className={`font-medium ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                        {result.student_answer || '未作答'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <span className="text-gray-600">正确答案: </span>
                      <span className="text-green-600 font-medium">{result.correct_answer}</span>
                    </div>
                  </div>
                  
                  {/* 解析 */}
                  {result.analysis && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 font-medium text-sm">💡 解析：</div>
                        <div className="text-sm text-blue-800 flex-1">{result.analysis}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* 如果是错题练习模式且没有错题，显示提示 */}
              {mode === 'wrong-questions' && submitResult.question_results.every(result => result.is_correct) && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">恭喜！所有题目都答对了</h3>
                  <p className="text-gray-600">本次练习中没有错题，继续保持！</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push('/exercises')}
            variant="outline"
          >
            返回练习列表
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
} 