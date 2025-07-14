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
}

export default function ExerciseResult({ submitResult, exercise, onRetry }: ExerciseResultProps) {
  const router = useRouter();

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
                <div className="text-2xl font-bold text-blue-600">{submitResult.total_score}</div>
                <div className="text-sm text-gray-600">总得分</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-700">{submitResult.max_score}</div>
                <div className="text-sm text-gray-600">满分</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{submitResult.summary.correct_count}</div>
                <div className="text-sm text-gray-600">答对题数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{submitResult.summary.accuracy_rate}%</div>
                <div className="text-sm text-gray-600">正确率</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {submitResult.pass_status ? (
                    <span className="text-green-600 font-medium">✓ 达到及格标准</span>
                  ) : (
                    <span className="text-orange-500 font-medium">✗ 未达到及格标准</span>
                  )}
                </span>
                <span className="text-gray-600">
                  及格分数: {submitResult.summary.pass_score}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 错题分析 */}
        {submitResult.question_results.some(qr => !qr.is_correct) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-red-600">错题分析</CardTitle>
              <CardDescription>
                以下是您答错的题目，请仔细查看正确答案和解析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {submitResult.question_results
                  .filter(qr => !qr.is_correct)
                  .map((result, index) => (
                    <div key={result.question_id} className="border rounded-lg p-4 bg-red-50">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">错误</Badge>
                          <span className="font-medium">题目 {index + 1}</span>
                        </div>
                        <p className="text-gray-900">{result.question_content}</p>
                      </div>
                      
                      {result.options && (
                        <div className="mb-3 space-y-1">
                          {Object.entries(result.options).map(([key, value]) => (
                            <div 
                              key={key} 
                              className={`text-sm p-2 rounded ${
                                result.correct_answer.includes(key) 
                                  ? 'bg-green-100 text-green-800 font-medium' 
                                  : result.student_answer.includes(key)
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {key}. {value}
                              {result.correct_answer.includes(key) && ' ✓ 正确答案'}
                              {result.student_answer.includes(key) && !result.correct_answer.includes(key) && ' ✗ 您的选择'}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">您的答案: </span>
                          <span className="text-red-600 font-medium">{result.student_answer || '未作答'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">正确答案: </span>
                          <span className="text-green-600 font-medium">{result.correct_answer}</span>
                        </div>
                      </div>
                      
                      {result.analysis && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <div className="text-sm text-blue-800">
                            <strong>解析：</strong>{result.analysis}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 全部题目结果 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>详细结果</CardTitle>
            <CardDescription>查看所有题目的答题情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submitResult.question_results.map((result, index) => (
                <div 
                  key={result.question_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      result.is_correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-900">
                      {result.question_content.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      result.is_correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.score_awarded}/{result.total_score}分
                    </span>
                    {result.is_correct ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onRetry}
            variant="outline"
          >
            重新练习
          </Button>
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