import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Lock, BookOpen, Phone, Mail } from "lucide-react";
import { Course } from "../contexts/AuthContext";

interface AccessDeniedProps {
  course: Course;
  onBackToDashboard: () => void;
}

export function AccessDenied({ course, onBackToDashboard }: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">课程访问受限</CardTitle>
          <CardDescription>您暂无权限访问此课程</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium">{course.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {course.category}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {course.description}
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">如需报名此课程</h4>
            <p className="text-sm text-blue-700 mb-3">
              请联系我们的课程顾问了解报名详情
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-blue-700">
                <Phone className="h-4 w-4" />
                <span>咨询热线：400-123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700">
                <Mail className="h-4 w-4" />
                <span>邮箱：support@training.com</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('tel:400-123-4567')}
            >
              联系课程顾问
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            如有疑问，请联系客服或查看您的课程报名状态
          </div>
        </CardContent>
      </Card>
    </div>
  );
}