import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileText, Play, PenTool, Trophy, CheckCircle, Clock } from "lucide-react";

interface CourseStats {
  // PDF课件统计
  total_pdfs: number;
  completed_pdfs: number;
  
  // 视频统计
  total_videos: number;
  completed_videos: number;
  
  // 练习统计
  total_exercises: number;
  completed_exercises: number;
  participated_exercises: number;
  
  // 考试统计
  total_exams: number;
  completed_exams: number;
  participated_exams: number;
  
  // 总体统计
  total_coursewares: number;
  completed_coursewares: number;
}

interface CourseStatsDisplayProps {
  stats: CourseStats;
  courseName: string;
  type?: 'pdfs' | 'videos' | 'exercises' | 'exams' | 'all';
}

export function CourseStatsDisplay({ stats, courseName, type = 'all' }: CourseStatsDisplayProps) {
  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getParticipationPercentage = (participated: number, total: number) => {
    return total > 0 ? Math.round((participated / total) * 100) : 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          {courseName} - 学习统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDF课件统计 */}
        {(type === 'all' || type === 'pdfs') && stats.total_pdfs > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">PDF课件</span>
              </div>
              <Badge variant="outline">
                {stats.completed_pdfs}/{stats.total_pdfs}
              </Badge>
            </div>
            <Progress 
              value={getProgressPercentage(stats.completed_pdfs, stats.total_pdfs)} 
              className="h-2"
            />
            <p className="text-sm text-gray-600">
              完成率: {getProgressPercentage(stats.completed_pdfs, stats.total_pdfs)}%
            </p>
          </div>
        )}

        {/* 视频统计 */}
        {(type === 'all' || type === 'videos') && stats.total_videos > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-red-600" />
                <span className="font-medium">视频课程</span>
              </div>
              <Badge variant="outline">
                {stats.completed_videos}/{stats.total_videos}
              </Badge>
            </div>
            <Progress 
              value={getProgressPercentage(stats.completed_videos, stats.total_videos)} 
              className="h-2"
            />
            <p className="text-sm text-gray-600">
              完成率: {getProgressPercentage(stats.completed_videos, stats.total_videos)}%
            </p>
          </div>
        )}

        {/* 练习统计 */}
        {(type === 'all' || type === 'exercises') && stats.total_exercises > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-green-600" />
                <span className="font-medium">练习</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  参与: {stats.participated_exercises}/{stats.total_exercises}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  完成: {stats.completed_exercises}/{stats.total_exercises}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>参与率</span>
                <span>{getParticipationPercentage(stats.participated_exercises, stats.total_exercises)}%</span>
              </div>
              <Progress 
                value={getParticipationPercentage(stats.participated_exercises, stats.total_exercises)} 
                className="h-1"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>完成率</span>
                <span>{getProgressPercentage(stats.completed_exercises, stats.total_exercises)}%</span>
              </div>
              <Progress 
                value={getProgressPercentage(stats.completed_exercises, stats.total_exercises)} 
                className="h-1"
              />
            </div>
          </div>
        )}

        {/* 考试统计 */}
        {(type === 'all' || type === 'exams') && stats.total_exams > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-600" />
                <span className="font-medium">考试</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  参与: {stats.participated_exams}/{stats.total_exams}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  通过: {stats.completed_exams}/{stats.total_exams}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>参与率</span>
                <span>{getParticipationPercentage(stats.participated_exams, stats.total_exams)}%</span>
              </div>
              <Progress 
                value={getParticipationPercentage(stats.participated_exams, stats.total_exams)} 
                className="h-1"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>通过率</span>
                <span>{getProgressPercentage(stats.completed_exams, stats.total_exams)}%</span>
              </div>
              <Progress 
                value={getProgressPercentage(stats.completed_exams, stats.total_exams)} 
                className="h-1"
              />
            </div>
          </div>
        )}

        {/* 总体统计 */}
        {type === 'all' && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-medium">总体进度</span>
              </div>
              <Badge variant="outline">
                {stats.completed_coursewares}/{stats.total_coursewares}
              </Badge>
            </div>
            <Progress 
              value={getProgressPercentage(stats.completed_coursewares, stats.total_coursewares)} 
              className="h-2"
            />
            <p className="text-sm text-gray-600">
              课件完成率: {getProgressPercentage(stats.completed_coursewares, stats.total_coursewares)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}