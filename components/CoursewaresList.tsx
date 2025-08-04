import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Play, 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  Download, 
  Eye,
  Loader2,
  AlertCircle,
  BookOpen,
  Headphones,
  File
} from "lucide-react";
import { toast } from "sonner";
import { apiService, isApiSuccess } from "../lib/api";
import { 
  ApiCoursewareListResponse,
  convertApiCoursewareToLocal 
} from "../types/api";

interface CoursewaresListProps {
  courseId?: number; // 可选：特定课程的课件
}

export function CoursewaresList({ courseId }: CoursewaresListProps) {
  const [coursewares, setCoursewares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  // 获取课件列表
  const fetchCoursewares = async (page = 1, search = "", category = "all") => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        per_page: 999,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (courseId) {
        params.course_id = courseId;
      }
      
      const response = await apiService.getCoursewares(params);
      
      if (isApiSuccess(response)) {
        const convertedCoursewares = response.data.coursewares.map(convertApiCoursewareToLocal);
        
        // 提取所有课件分类
        const allCategories = Array.from(new Set(
          convertedCoursewares
            .map(cw => cw.category)
            .filter((category): category is string => Boolean(category)) // 类型守卫确保过滤后都是string
        ));
        setCategories(allCategories);
        
        // 根据分类筛选
        const filteredCoursewares = category === "all" 
          ? convertedCoursewares 
          : convertedCoursewares.filter(cw => cw.category === category);
        
        setCoursewares(filteredCoursewares);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        setCurrentPage(page);
      } else {
        toast.error("获取课件列表失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取课件列表失败:", error);
      toast.error("获取课件列表失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCoursewares();
  }, [courseId]);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCoursewares(1, searchTerm, selectedCategory);
  };

  // 分类筛选处理
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    fetchCoursewares(1, searchTerm, category);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    fetchCoursewares(page, searchTerm, selectedCategory);
  };

  // 获取课件类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'audio':
        return <Headphones className="h-4 w-4 text-green-600" />;
      case 'document':
        return <File className="h-4 w-4 text-orange-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  // 获取课件类型标签
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">视频</Badge>;
      case 'pdf':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">PDF</Badge>;
      case 'audio':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">音频</Badge>;
      case 'document':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">文档</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">其他</Badge>;
    }
  };

  // 处理课件访问
  const handleAccessCourseware = (courseware: any) => {
    if (!courseware.is_enrolled) {
      toast.warning("需要先选择该课程才能访问课件", {
        description: "请在课程中心选择对应的课程"
      });
      return;
    }

    if (courseware.content_url) {
      // 根据课件类型做不同的处理
      if (courseware.type === 'video') {
        toast.info("正在打开视频课件...");
        // TODO: 打开视频播放器
      } else if (courseware.type === 'pdf') {
        toast.info("正在打开PDF文档...");
        // TODO: 打开PDF查看器
      } else if (courseware.type === 'audio') {
        toast.info("正在打开音频课件...");
        // TODO: 打开音频播放器
      } else if (courseware.type === 'document') {
        toast.info("正在打开文档...");
        // TODO: 打开文档查看器
      } else {
        toast.info("正在打开课件...");
        // TODO: 通用文件处理
      }
      
      // 更新学习进度（如果可学习）
      if (courseware.course && courseware.is_enrolled) {
        apiService.updateCoursewareProgress(
          courseware.course.id,
          courseware.courseware_id,
          'in_progress'
        );
      }
    } else {
      toast.error("课件文件不存在");
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">课件库</h2>
          <p className="text-gray-600">
            {courseId ? "课程课件列表" : "所有可用的学习课件"}
            {total > 0 && ` · 共 ${total} 个课件`}
          </p>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索课件名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-64"
            />
          </div>
          
          {/* 分类筛选 */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="分类筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((category, index) => (
                <SelectItem key={index} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleSearch} variant="outline">
            搜索
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">加载中...</span>
        </div>
      )}

      {/* 课件列表 */}
      {!loading && (
        <>
          {coursewares.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursewares.map((courseware) => (
                  <Card key={courseware.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(courseware.type)}
                          <CardTitle className="text-lg line-clamp-2">
                            {courseware.title}
                          </CardTitle>
                        </div>
                        {getTypeBadge(courseware.type)}
                      </div>
                      
                      {/* 课程信息 */}
                      {courseware.course && (
                        <div className="space-y-2">
                          <CardDescription className="text-sm">
                            课程：{courseware.course.name}
                          </CardDescription>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={courseware.is_enrolled ? 
                                "border-green-300 text-green-700" : 
                                "border-gray-300 text-gray-600"
                              }
                            >
                              {courseware.is_enrolled ? "可学习" : "未选课"}
                            </Badge>
                            {courseware.category && (
                              <Badge variant="secondary" className="text-xs">
                                {courseware.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* 时长信息 */}
                        {courseware.duration_minutes && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{courseware.duration_minutes} 分钟</span>
                          </div>
                        )}
                        
                        {/* 操作按钮 */}
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAccessCourseware(courseware)}
                            className="flex-1"
                            disabled={!courseware.is_enrolled}
                          >
                            {courseware.is_enrolled ? (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                开始学习
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                需要选课
                              </>
                            )}
                          </Button>
                          
                          {courseware.content_url && courseware.is_enrolled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast.info("正在准备下载...");
                                // TODO: 实现下载功能
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  
                  <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg text-gray-600 mb-2">暂无课件</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm || selectedCategory !== "all" ? "没有找到匹配的课件" : "还没有上传任何课件"}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <Button onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    fetchCoursewares(1, "", "all");
                  }}>
                    清除筛选
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 