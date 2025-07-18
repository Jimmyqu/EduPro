import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

import { Search, FileText, Download, Calendar, Lock, Users, Star, Clock, Loader2, AlertCircle, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { apiService, isApiSuccess } from "../lib/api";
import { convertApiCoursewareToLocal } from "../types/api";

interface PDFLibraryProps {
  onBack: () => void;
  courseId?: number;
}

export function PDFLibrary({ onBack, courseId }: PDFLibraryProps) {
  const [pdfDocuments, setPdfDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  // 初始化状态
  const [courses, setCourses] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 获取初始数据（课件和课程列表）
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 如果传入了courseId，直接获取该课程的PDF
      if (courseId) {
        const params = {
          page: 1,
          per_page: 12,
          course_id: courseId
        };
        
        const response = await apiService.getCoursewares(params);
        
        if (isApiSuccess(response)) {
          // 只显示PDF类型的课件
          const allCoursewares = response.data.coursewares.map(convertApiCoursewareToLocal);
          const pdfCoursewares = allCoursewares.filter(courseware => 
            courseware.type === 'pdf' || courseware.content_url?.includes('.pdf')
          );
          
          setPdfDocuments(pdfCoursewares);
          setTotalPages(response.data.total_pages);
          setTotal(response.data.total);
          setCurrentPage(1);
        } else {
          toast.error("获取PDF列表失败", { description: response.message });
        }
      } else {
        // 并行获取课件和课程数据
        const [coursewaresResponse, coursesResponse] = await Promise.all([
          apiService.getCoursewares({ page: 1, per_page: 12 }),
          apiService.getCourses({ per_page: 50 })
        ]);
        
        if (isApiSuccess(coursewaresResponse)) {
          // 只显示PDF类型的课件
          const allCoursewares = coursewaresResponse.data.coursewares.map(convertApiCoursewareToLocal);
          const pdfCoursewares = allCoursewares.filter(courseware => 
            courseware.type === 'pdf' || courseware.content_url?.includes('.pdf')
          );
          
          setPdfDocuments(pdfCoursewares);
          setTotalPages(coursewaresResponse.data.total_pages);
          setTotal(coursewaresResponse.data.total);
          setCurrentPage(1);
        } else {
          toast.error("获取PDF列表失败", { description: coursewaresResponse.message });
        }

        // 处理课程列表响应
        if (isApiSuccess(coursesResponse)) {
          setCourses(coursesResponse.data.courses);
          setDataLoaded(true);
        }
      }

    } catch (error) {
      console.error("获取数据失败:", error);
      toast.error("获取数据失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 获取PDF课件列表（用于搜索、筛选、分页等操作）
  const fetchPDFs = async (page = 1, search = "", courseId?: string) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        per_page: 12,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (courseId) {
        params.course_id = parseInt(courseId);
      }
      
      const response = await apiService.getCoursewares(params);
      
      if (isApiSuccess(response)) {
        // 只显示PDF类型的课件
        const allCoursewares = response.data.coursewares.map(convertApiCoursewareToLocal);
        const pdfCoursewares = allCoursewares.filter(courseware => 
          courseware.type === 'pdf' || courseware.content_url?.includes('.pdf')
        );
        
        setPdfDocuments(pdfCoursewares);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        setCurrentPage(page);
      } else {
        toast.error("获取PDF列表失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取PDF列表失败:", error);
      toast.error("获取PDF列表失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 使用ref防止在严格模式下重复调用API
  const initialFetchRef = useRef(false);
  
  // 组件挂载时获取初始数据
  useEffect(() => {
    // 避免在严格模式下重复调用API
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchInitialData();
    }
  }, []); // 只在组件挂载时调用一次

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPDFs(1, searchTerm, selectedCourse || undefined);
  };

  // 课程筛选
  const handleCourseSelect = (courseId: string | null) => {
    setSelectedCourse(courseId);
    setCurrentPage(1);
    fetchPDFs(1, searchTerm, courseId || undefined);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    fetchPDFs(page, searchTerm, selectedCourse || undefined);
  };

  // PDF操作处理
  const handlePDFAction = async (pdf: any, action: 'download' | 'view') => {
    if (!pdf.is_enrolled) {
      const actionText = action === 'download' ? '下载' : '查看';
      toast.warning(`需要先选择该课程才能${actionText}PDF`, {
        description: "请在课程中心选择对应的课程"
      });
      return;
    }

    console.log(pdf.content_url);
    if (!pdf.content_url) {
      toast.error("PDF文件不存在");
      return;
    }

    try {
      let fileUrl = pdf.content_url;
      
      // 如果是OSS链接，需要获取签名URL
      if (fileUrl) {
        const loadingText = action === 'download' ? "正在获取文件下载链接..." : "正在获取文件查看链接...";
        toast.loading(loadingText, { id: 'oss-loading' });
        
        const response = await apiService.getOSSSignedUrl(fileUrl);
        
        if (isApiSuccess(response) && response.data) {
          fileUrl = response.data.url;
          toast.dismiss('oss-loading');
        } else {
          toast.dismiss('oss-loading');
          const errorText = action === 'download' ? "获取文件下载链接失败" : "获取文件查看链接失败";
          toast.error(response.message || errorText);
          return;
        }
      }

      if (action === 'download') {
        // 下载功能 - 使用原始OSS URL
        const link = document.createElement('a');
        link.href = fileUrl; // 使用原始URL，不替换域名
        link.download = `${pdf.title}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`开始下载：${pdf.title}`);
      } else if (action === 'view') {
        // 查看功能 - 替换为自定义域名后在新窗口中打开PDF
        const viewUrl = fileUrl.replace("austin-edu-pro.oss-rg-china-mainland.aliyuncs.com", "image.19920316.xyz");
        window.open(viewUrl, '_blank');
        toast.success(`正在打开：${pdf.title}`);
      }
      
      // 更新学习进度
      if (pdf.course && pdf.is_enrolled) {
        apiService.updateCoursewareProgress(
          parseInt(pdf.course.id),
          pdf.courseware_id,
          'completed'
        );
      }
    } catch (error) {
      const actionText = action === 'download' ? '下载' : '查看';
      console.error(`PDF${actionText}失败:`, error);
      toast.error(`${actionText}失败，请稍后重试`);
    }
  };

  // 课程统计
  const getEnrolledPDFsCount = () => {
    return pdfDocuments.filter(pdf => pdf.is_enrolled).length;
  };

  const getCourseStats = (courseId: string) => {
    const coursePDFs = pdfDocuments.filter(pdf => pdf.course?.id === courseId);
    const enrolledPDFs = coursePDFs.filter(pdf => pdf.is_enrolled);
    return {
      total: coursePDFs.length,
      enrolled: enrolledPDFs.length
    };
  };

  // 格式化时长
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "阅读时长未知";
    if (minutes < 60) return `约${minutes}分钟阅读`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `约${hours}小时${mins > 0 ? mins + '分钟' : ''}阅读`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索PDF标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>

          {/* 课程筛选 - 只在没有传入courseId时显示 */}
          {!courseId && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCourse === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCourseSelect(null)}
              >
                全部课程
              </Button>
              {courses.map((course) => {
                const stats = getCourseStats(course.course_id.toString());
                return (
                  <Button
                    key={course.course_id}
                    variant={selectedCourse === course.course_id.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCourseSelect(course.course_id.toString())}
                    className="flex items-center space-x-2"
                  >
                    <span>{course.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stats.enrolled}/{stats.total}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">加载中...</span>
          </div>
        )}

        {/* PDF列表 */}
        {!loading && (
          <>
            {pdfDocuments.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pdfDocuments.map((pdf) => (
                    <Card key={pdf.id} className={`hover:shadow-lg transition-shadow ${
                      !pdf.is_enrolled ? 'opacity-75' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        {/* 标题和缩略图布局 */}
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg line-clamp-2 flex-1">
                            {pdf.title}
                          </CardTitle>
                          
                          {/* PDF缩略图 */}
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                              <FileText className="h-8 w-8 text-white" />
                            </div>
                            
                            {/* 权限状态标识 */}
                            {!pdf.is_enrolled && (
                              <div className="absolute -top-1 -right-1">
                                <Badge className="bg-gray-800 text-white text-xs px-1 py-0.5">
                                  <Lock className="h-2 w-2 mr-0.5" />
                                  需选课
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {pdf.course && (
                          <div className="space-y-2">
                            <CardDescription className="text-sm">
                              课程：{pdf.course.name}
                            </CardDescription>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {pdf.course.category}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={pdf.is_enrolled ? 
                                  "border-green-300 text-green-700" : 
                                  "border-gray-300 text-gray-600"
                                }
                              >
                                {pdf.is_enrolled ? "可学习" : "未选课"}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          {/* 文档信息 */}
                          <div className="space-y-1 text-sm text-gray-600">
                            {pdf.duration_minutes && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatDuration(pdf.duration_minutes)}</span>
                              </div>
                            )}
                            {pdf.course?.created_at && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(pdf.course.created_at)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handlePDFAction(pdf, 'view')}
                              variant="outline"
                              className="flex-1"
                              disabled={!pdf.is_enrolled}
                            >
                              {pdf.is_enrolled ? (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  查看
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  需要选课
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handlePDFAction(pdf, 'download')}
                              className="flex-1"
                              disabled={!pdf.is_enrolled}
                            >
                              {pdf.is_enrolled ? (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  下载
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  需要选课
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 space-x-2">
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
                  <h3 className="text-lg text-gray-600 mb-2">暂无PDF文档</h3>
                  <p className="text-gray-500 text-center mb-4">
                    {searchTerm ? "没有找到匹配的PDF" : "还没有上传任何PDF课件"}
                  </p>
                  {searchTerm && (
                    <Button onClick={() => {
                      setSearchTerm("");
                      fetchPDFs(1, "");
                    }}>
                      清除搜索
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

    </div>
  );
}