import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Play, Clock, Search, ArrowLeft, Lock, BookOpen, Users, Star, Loader2, AlertCircle, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { apiService, isApiSuccess } from "../lib/api";
import { convertApiCoursewareToLocal } from "../types/api";

interface VideoLibraryProps {
  onBack: () => void;
  courseId?: number;
}

export function VideoLibrary({ onBack, courseId }: VideoLibraryProps) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const { user } = useAuth();

  // 存储所有视频数据用于前端筛选
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const itemsPerPage = 12;

  // 前端筛选和搜索逻辑
  const filterVideos = (search = "", courseId?: string, category = "all") => {
    let filtered = [...allVideos];
    
    // 课程筛选
    if (courseId) {
      filtered = filtered.filter(video => video.course?.id === courseId);
    }
    
    // 分类筛选
    if (category !== "all") {
      filtered = filtered.filter(video => video.category === category);
    }
    
    // 搜索筛选
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchLower) ||
        video.course?.name.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredVideos(filtered);
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  // 获取当前页的视频数据
  const getCurrentPageVideos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVideos.slice(startIndex, endIndex);
  };

  // 获取所有课程列表用于筛选
  const [courses, setCourses] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 获取初始数据（视频和课程列表）
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 如果传入了courseId，直接获取该课程的视频
      if (courseId) {
        const params = {
          page: 1,
          per_page: 999,
          course_id: courseId
        };
        
        const response = await apiService.getCoursewares(params);
        
        if (isApiSuccess(response)) {
          // 只显示视频类型的课件
          const allCoursewares = response.data.coursewares.map(convertApiCoursewareToLocal);
          const videoCoursewares = allCoursewares.filter(courseware => 
            courseware.type === 'video'
          );
          
          // 提取所有课件分类
          const allCategories = Array.from(new Set(
            videoCoursewares
              .map(cw => cw.category)
              .filter((category): category is string => Boolean(category)) // 过滤掉null和undefined，并进行类型断言
          ));
          setCategories(allCategories);
          
          // 存储所有视频数据
          setAllVideos(videoCoursewares);
          setFilteredVideos(videoCoursewares);
          setTotal(videoCoursewares.length);
          setTotalPages(Math.ceil(videoCoursewares.length / itemsPerPage));
          setCurrentPage(1);
        } else {
          toast.error("获取视频列表失败", { description: response.message });
        }
      } else {
        // 并行获取视频和课程数据
        const [coursewaresResponse, coursesResponse] = await Promise.all([
          apiService.getCoursewares({ page: 1, per_page: 12 }),
          apiService.getCourses({ per_page: 50 })
        ]);
        
        if (isApiSuccess(coursewaresResponse)) {
          // 只显示视频类型的课件
          const allCoursewares = coursewaresResponse.data.coursewares.map(convertApiCoursewareToLocal);
          const videoCoursewares = allCoursewares.filter(courseware => 
            courseware.type === 'video'
          );
          
          // 提取所有课件分类
          const allCategories = Array.from(new Set(
            videoCoursewares
              .map(cw => cw.category)
              .filter((category): category is string => Boolean(category)) // 过滤掉null和undefined，并进行类型断言
          ));
          setCategories(allCategories);
          
          // 存储所有视频数据
          setAllVideos(videoCoursewares);
          setFilteredVideos(videoCoursewares);
          setTotal(videoCoursewares.length);
          setTotalPages(Math.ceil(videoCoursewares.length / itemsPerPage));
          setCurrentPage(1);
        } else {
          toast.error("获取视频列表失败", { description: coursewaresResponse.message });
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
    filterVideos(searchTerm, selectedCourse || undefined, selectedCategory);
  };

  // 课程筛选
  const handleCourseSelect = (courseId: string | null) => {
    setSelectedCourse(courseId);
    filterVideos(searchTerm, courseId || undefined, selectedCategory);
  };
  
  // 分类筛选处理
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterVideos(searchTerm, selectedCourse || undefined, category);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 播放视频
  const handleVideoClick = async (video: any) => {
    if (!video.is_enrolled) {
      toast.warning("需要先选择该课程才能观看视频", {
        description: "请在课程中心选择对应的课程"
      });
      return;
    }

    if (!video.content_url) {
      toast.error("视频文件不存在");
      return;
    }

    try {
      let videoUrl = video.content_url;
      
      // 如果是OSS链接，需要获取签名URL
      if (videoUrl) {
        toast.loading("正在获取视频访问链接...", { id: 'oss-loading' });
        
        const response = await apiService.getOSSSignedUrl(videoUrl);
        
        if (isApiSuccess(response) && response.data) {
          videoUrl = response.data.url;
          toast.dismiss('oss-loading');
        } else {
          toast.dismiss('oss-loading');
          toast.error(response.message || "获取视频访问链接失败");
          return;
        }
      }

      // 使用签名URL创建新的视频对象
      const videoWithSignedUrl = { ...video, content_url: videoUrl };
      setSelectedVideo(videoWithSignedUrl);
      setShowPlayer(true);
      
      // 更新学习进度
      if (video.course && video.is_enrolled) {
        apiService.updateCoursewareProgress(
          parseInt(video.course.id),
          video.courseware_id,
          'in_progress'
        );
      }
    } catch (error) {
      console.error('视频播放失败:', error);
      toast.error("视频播放失败，请稍后重试");
    }
  };

  // 课程统计
  const getEnrolledVideosCount = () => {
    return filteredVideos.filter(video => video.is_enrolled).length;
  };

  const getCourseStats = (courseId: string) => {
    const courseVideos = allVideos.filter(video => video.course?.id === courseId);
    const enrolledVideos = courseVideos.filter(video => video.is_enrolled);
    return {
      total: courseVideos.length,
      enrolled: enrolledVideos.length
    };
  };

  // 格式化时长
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "未知时长";
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div>
              <p className="text-gray-600">
                {courseId ? "课程视频列表" : "所有视频课程"}
                {total > 0 && ` · 共 ${total} 个视频`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索视频名称..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // 实时搜索
                  filterVideos(e.target.value, selectedCourse || undefined, selectedCategory);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-64"
              />
            </div>
            
            {/* 课程筛选 */}
            {!courseId && courses.length > 0 && (
              <div>
                <Select value={selectedCourse || "all"} onValueChange={(value) => handleCourseSelect(value === "all" ? null : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择课程" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部课程</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.course_id} value={course.course_id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 分类筛选 */}
            {categories.length > 0 && (
              <div>
                <Select onValueChange={handleCategoryChange} value={selectedCategory}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">加载中...</span>
          </div>
        )}

        {/* 视频列表 */}
        {!loading && (
          <>
            {filteredVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getCurrentPageVideos().map((video) => (
                    <Card 
                      key={video.id} 
                      className={`group hover:shadow-lg transition-all cursor-pointer ${
                        !video.is_enrolled ? 'opacity-75' : ''
                      }`}
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="relative">
                        {/* 视频缩略图 */}
                        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                          <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        
                        {/* 权限状态标识 */}
                        {!video.is_enrolled && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-gray-800 text-white">
                              <Lock className="h-3 w-3 mr-1" />
                              需选课
                            </Badge>
                          </div>
                        )}
                        
                        {/* 时长标识 */}
                        {video.duration_minutes && (
                          <div className="absolute bottom-2 right-2">
                            <Badge className="bg-black bg-opacity-70 text-white text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(video.duration_minutes)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors h-14 flex items-start">
                            {video.title}
                          </CardTitle>
                          {video.category && (
                            <Badge variant="outline" className="text-xs">
                              {video.category}
                            </Badge>
                          )}
                        </div>
                        
                        {video.course && (
                          <div className="space-y-2">
                            {/* <CardDescription className="text-sm">
                              课程：{video.course.name}
                            </CardDescription> */}
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {video.course.category}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={video.is_enrolled ? 
                                  "border-green-300 text-green-700" : 
                                  "border-gray-300 text-gray-600"
                                }
                              >
                                {video.is_enrolled ? "可学习" : "未选课"}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardHeader>

                      <CardFooter>
                        <Button
                          className="w-full"
                          disabled={!video.is_enrolled}
                        >
                          {video.is_enrolled ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              开始观看
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              需要选课
                            </>
                          )}
                        </Button>
                      </CardFooter>
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
                  <Play className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg text-gray-600 mb-2">暂无视频</h3>
                  <p className="text-gray-500 text-center mb-4">
                    {searchTerm || selectedCategory !== "all" || selectedCourse ? "没有找到匹配的视频" : "还没有上传任何视频课件"}
                  </p>
                  {(searchTerm || selectedCategory !== "all" || selectedCourse) && (
                    <Button onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedCourse(null);
                      filterVideos("", undefined, "all");
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

      {/* 视频播放器对话框 */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>{selectedVideo?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="space-y-4">
              {/* 视频播放区域 */}
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                {selectedVideo.content_url ? (
                  <video 
                    controls 
                    className="w-full h-full rounded-lg"
                    src={selectedVideo.content_url}
                  >
                    您的浏览器不支持视频播放。
                  </video>
                ) : (
                  <div className="text-white text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>视频文件暂时无法播放</p>
                  </div>
                )}
              </div>
              
              {/* 视频信息 */}
              <div className="space-y-2">
                {selectedVideo.course && (
                  <p className="text-sm text-gray-600">
                    课程：{selectedVideo.course.name}
                  </p>
                )}
                {selectedVideo.duration_minutes && (
                  <p className="text-sm text-gray-600">
                    时长：{formatDuration(selectedVideo.duration_minutes)}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}