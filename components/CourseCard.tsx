import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { BookOpen, Users, Clock, Star, Play, FileText, PenTool, Trophy } from "lucide-react";

interface Course {
  course_id: number;
  title: string;
  description?: string;
  category: string;
  level: string;
  instructor?: string;
  duration_hours?: number;
  student_count?: number;
  rating?: number;
  is_enrolled?: boolean;
  cover_image?: string;
}

interface CourseCardProps {
  course: Course;
  type: 'coursewares' | 'videos' | 'exercises' | 'exams';
  onSelect: (courseId: number) => void;
}

export function CourseCard({ course, type, onSelect }: CourseCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'coursewares':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'videos':
        return <Play className="h-5 w-5 text-red-600" />;
      case 'exercises':
        return <PenTool className="h-5 w-5 text-green-600" />;
      case 'exams':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'coursewares':
        return '课件';
      case 'videos':
        return '视频';
      case 'exercises':
        return '练习';
      case 'exams':
        return '考试';
      default:
        return '内容';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return '初级';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return level;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <div className="relative">
        {/* 课程封面 */}
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
          {course.cover_image ? (
            <img 
              src={course.cover_image} 
              alt={course.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="text-center text-white">
              {getTypeIcon()}
              <p className="mt-2 text-sm font-medium">{getTypeLabel()}</p>
            </div>
          )}
        </div>
        
        {/* 选课状态标识 */}
        <div className="absolute top-2 right-2">
          <Badge 
            className={course.is_enrolled ? 
              "bg-green-600 text-white" : 
              "bg-gray-800 text-white"
            }
          >
            {course.is_enrolled ? "已选课" : "未选课"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </CardTitle>
            {course.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {course.description}
              </CardDescription>
            )}
          </div>
        </div>
        
        {/* 课程标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {course.category}
          </Badge>
          <Badge className={`text-xs ${getLevelColor(course.level)}`}>
            {getLevelLabel(course.level)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* 课程信息 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            {course.duration_hours && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{course.duration_hours}小时</span>
              </div>
            )}
            {course.student_count && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{course.student_count}人</span>
              </div>
            )}
            {course.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          {/* 讲师信息 */}
          {course.instructor && (
            <div className="text-sm text-gray-600">
              讲师：{course.instructor}
            </div>
          )}

          {/* 操作按钮 */}
          <Button
            onClick={() => onSelect(course.course_id)}
            className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
            disabled={!course.is_enrolled}
          >
            {getTypeIcon()}
            <span className="ml-2">
              {course.is_enrolled ? `查看${getTypeLabel()}` : `需要选课`}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}