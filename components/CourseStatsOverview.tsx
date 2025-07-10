import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Play, BookOpen, FileText, Clock, Award, Target } from "lucide-react";
import { CourseProgress } from "../contexts/AuthContext";

interface CourseStatsOverviewProps {
  courseProgress: CourseProgress[];
}

export function CourseStatsOverview({ courseProgress = [] }: CourseStatsOverviewProps) {
  // 计算总体统计
  const totalStats = courseProgress.reduce(
    (acc, course) => ({
      totalVideos: acc.totalVideos + (course.totalVideos || 0),
      watchedVideos: acc.watchedVideos + (course.watchedVideos || 0),
      totalExercises: acc.totalExercises + (course.totalExercises || 0),
      completedExercises: acc.completedExercises + (course.completedExercises || 0),
      totalPDFs: acc.totalPDFs + (course.totalPDFs || 0),
      readPDFs: acc.readPDFs + (course.readPDFs || 0),
      studyHours: acc.studyHours + (course.studyHours || 0),
    }),
    {
      totalVideos: 0,
      watchedVideos: 0,
      totalExercises: 0,
      completedExercises: 0,
      totalPDFs: 0,
      readPDFs: 0,
      studyHours: 0,
    }
  );

  const completedCourses = courseProgress.filter(course => (course.completionPercentage || 0) >= 90).length;
  const averageProgress = courseProgress.length > 0 
    ? Math.round(courseProgress.reduce((sum, course) => sum + (course.completionPercentage || 0), 0) / courseProgress.length)
    : 0;

  const stats = [
    {
      title: "观看视频",
      icon: Play,
      current: totalStats.watchedVideos,
      total: totalStats.totalVideos,
      percentage: totalStats.totalVideos > 0 ? Math.round((totalStats.watchedVideos / totalStats.totalVideos) * 100) : 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "完成练习", 
      icon: BookOpen,
      current: totalStats.completedExercises,
      total: totalStats.totalExercises,
      percentage: totalStats.totalExercises > 0 ? Math.round((totalStats.completedExercises / totalStats.totalExercises) * 100) : 0,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "阅读资料",
      icon: FileText,
      current: totalStats.readPDFs,
      total: totalStats.totalPDFs,
      percentage: totalStats.totalPDFs > 0 ? Math.round((totalStats.readPDFs / totalStats.totalPDFs) * 100) : 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "学习时长",
      icon: Clock,
      current: totalStats.studyHours,
      total: null,
      percentage: null,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      unit: "小时",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <div className="text-2xl">
                      {stat.current}
                      {stat.unit && <span className="text-sm ml-1">{stat.unit}</span>}
                    </div>
                    {stat.total && (
                      <div className="text-sm text-gray-500">
                        / {stat.total}
                      </div>
                    )}
                  </div>
                  {stat.percentage !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">完成度</span>
                        <span className={`text-xs ${stat.color}`}>{stat.percentage}%</span>
                      </div>
                      <Progress value={stat.percentage} className="h-1 bg-primary-light" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 学习成就概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">已完成课程</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{completedCourses}</div>
            <p className="text-xs text-muted-foreground">
              共 {courseProgress.length} 门课程
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">平均进度</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{averageProgress}%</div>
            <p className="text-xs text-muted-foreground">
              所有课程平均进度
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">在学课程</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{courseProgress.length}</div>
            <p className="text-xs text-muted-foreground">
              正在学习的课程数量
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}