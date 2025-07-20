import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Play, BookOpen, FileText, Clock } from "lucide-react";
import { CourseProgress } from "../contexts/AuthContext";
import { Section } from "../types/navigation";

interface CourseProgressCardProps {
  course: CourseProgress;
  onNavigate: (section: Section) => void;
}

export function CourseProgressCard({ course, onNavigate }: CourseProgressCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* 课程标题和进度 */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{course.courseName}</h3>
            <p className="text-xs text-gray-500">
              {course.category}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium">{course.completionPercentage}%</span>
          </div>
        </div>
        
        {/* 最后学习时间 */}
        <p className="text-xs text-gray-500">
          最后学习: {formatDate(course.lastActivity)}
        </p>
        
        {/* 总体进度条 */}
        <Progress value={course.completionPercentage} className="h-1.5" />
        
        {/* 学习统计 */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium">视频</div>
            <div className="text-gray-700">{course.watchedVideos}/{course.totalVideos}</div>
            <Progress 
              value={(course.watchedVideos / (course.totalVideos || 1)) * 100} 
              className="h-1 mt-1" 
            />
          </div>
          
          <div className="text-center">
            <div className="font-medium">练习</div>
            <div className="text-gray-700">{course.completedExercises}/{course.totalExercises || 20}</div>
            <Progress 
              value={(course.completedExercises / (course.totalExercises || 20)) * 100} 
              className="h-1 mt-1" 
            />
          </div>
          
          <div className="text-center">
            <div className="font-medium">资料</div>
            <div className="text-gray-700">{course.readPDFs}/{course.totalPDFs || 15}</div>
            <Progress 
              value={(course.readPDFs / (course.totalPDFs || 15)) * 100} 
              className="h-1 mt-1" 
            />
          </div>
        </div>

        {/* 学习时长 */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-xs text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            <span>学习时长: {course.studyHours}小时</span>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onNavigate('videos')}
            className="h-7 text-xs"
          >
            继续学习
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}