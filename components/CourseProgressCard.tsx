import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Play, BookOpen, FileText, Clock, TrendingUp } from "lucide-react";
import { CourseProgress } from "../contexts/AuthContext";

interface CourseProgressCardProps {
  course: CourseProgress;
  onNavigate: (section: string) => void;
}

export function CourseProgressCard({ course, onNavigate }: CourseProgressCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Mathematics: 'bg-blue-100 text-blue-800',
      Physics: 'bg-purple-100 text-purple-800',
      Chemistry: 'bg-green-100 text-green-800',
      Biology: 'bg-orange-100 text-orange-800',
      History: 'bg-yellow-100 text-yellow-800',
      Literature: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{course.courseName}</CardTitle>
            <Badge className={getCategoryColor(course.category)}>
              {course.category}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span className={getProgressColor(course.completionPercentage)}>
              {course.completionPercentage}%
            </span>
          </div>
        </div>
        <CardDescription>
          最后学习: {formatDate(course.lastActivity)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">总体进度</span>
            <span className="text-sm">{course.completionPercentage}%</span>
          </div>
          <Progress value={course.completionPercentage} className="h-2" />
        </div>

        {/* 详细进度 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <Play className="h-3 w-3" />
              <span>视频</span>
            </div>
            <div className="font-medium">
              {course.watchedVideos}/{course.totalVideos}
            </div>
            <Progress 
              value={(course.watchedVideos / course.totalVideos) * 100} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <BookOpen className="h-3 w-3" />
              <span>练习</span>
            </div>
            <div className="font-medium">
              {course.completedExercises}/{course.totalExercises}
            </div>
            <Progress 
              value={(course.completedExercises / course.totalExercises) * 100} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-gray-600">
              <FileText className="h-3 w-3" />
              <span>资料</span>
            </div>
            <div className="font-medium">
              {course.readPDFs}/{course.totalPDFs}
            </div>
            <Progress 
              value={(course.readPDFs / course.totalPDFs) * 100} 
              className="h-1" 
            />
          </div>
        </div>

        {/* 学习时长 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>学习时长: {course.studyHours}小时</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onNavigate('videos')}
            >
              继续学习
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}