import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Play, Clock, Search, ArrowLeft, Lock, BookOpen, Wrench, Users, Star } from "lucide-react";
import { useAuth, availableCourses } from "../contexts/AuthContext";

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  courseId: string;
  courseName: string;
  subCourseId: string;
  subCourseName: string;
  type: 'theory' | 'practice';
  episode: number;
  thumbnail: string;
  videoUrl: string;
}

interface VideoLibraryProps {
  onBack: () => void;
}

export function VideoLibrary({ onBack }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { user, hasAccess } = useAuth();

  // 生成视频数据
  const generateVideos = (): Video[] => {
    const videos: Video[] = [];
    
    availableCourses.forEach(course => {
      course.subCourses.forEach(subCourse => {
        for (let i = 1; i <= subCourse.videoCount; i++) {
          const isTheory = subCourse.type === 'theory';
          const typePrefix = isTheory ? '理论' : '实操';
          const baseTopics = {
            'health-manager': {
              theory: [
                '健康管理概述', '健康风险评估', '健康档案管理', '健康教育与促进', 
                '营养学基础', '运动学基础', '心理健康管理', '慢病管理', 
                '健康管理法律法规', '健康管理伦理', '健康经济学', '流行病学基础',
                '健康信息系统', '健康管理质量控制', '健康管理效果评价', '社区健康管理',
                '职业健康管理', '老年健康管理', '妇幼健康管理', '健康管理研究方法',
                '国际健康管理发展', '健康管理案例分析', '健康管理前沿技术', '健康管理实践指南'
              ],
              practice: [
                '健康体检操作', '血压测量技术', '身体成分分析', '心电图解读',
                '健康风险评估实操', '健康计划制定', '健康咨询技巧', '健康教育设计',
                '运动处方制定', '膳食指导实践', '健康监测技术', '慢病管理实操',
                '健康档案建立', '健康数据分析', '健康报告撰写', '健康随访技术',
                '团体健康管理', '健康促进活动', '健康管理软件使用', '应急处理技能',
                '沟通技巧实践', '健康管理质控', '效果评估方法', '综合案例实操'
              ]
            },
            'mental-health-counselor': {
              theory: [
                '心理学基础理论', '发展心理学', '社会心理学', '认知心理学',
                '心理咨询理论', '人格心理学', '异常心理学', '心理测量学',
                '心理统计学', '咨询心理学', '心理治疗理论', '心理健康教育',
                '危机干预理论', '团体心理咨询', '家庭治疗理论', '儿童心理学',
                '青少年心理学', '老年心理学', '职业心理学', '健康心理学',
                '积极心理学', '文化心理学', '心理伦理学', '心理研究方法',
                '神经心理学', '生物心理学', '环境心理学', '教育心理学'
              ],
              practice: [
                '咨询关系建立', '倾听技巧训练', '共情技能练习', '提问技术实操',
                '心理评估实践', '量表使用技巧', '咨询记录撰写', '个案概念化',
                '咨询目标设定', '干预策略选择', '认知行为技术', '人本主义技术',
                '精神分析技术', '家庭治疗技术', '团体咨询实操', '危机干预实践',
                '放松训练指导', '正念练习指导', '行为改变技术', '情绪调节训练',
                '沟通技能训练', '压力管理技术', '自我觉察练习', '督导技能培养',
                '伦理案例分析', '文化敏感性', '特殊人群咨询', '综合案例实操'
              ]
            },
            'childcare-specialist': {
              theory: [
                '婴幼儿生理发育', '婴幼儿心理发育', '婴幼儿营养需求', '母乳喂养知识',
                '辅食添加原理', '婴幼儿疾病预防', '疫苗接种知识', '安全防护理论',
                '早期教育理论', '感觉统合理论', '亲子关系理论', '游戏发展理论',
                '语言发展理论', '认知发展理论', '社会性发展', '情绪发展理论',
                '睡眠发展规律', '排便训练理论', '婴幼儿心理健康', '发育迟缓识别'
              ],
              practice: [
                '新生儿护理操作', '婴儿洗澡技巧', '换尿布技术', '喂奶姿势指导',
                '辅食制作实操', '婴儿按摩手法', '体温测量技巧', '常见症状观察',
                '婴儿抚触操作', '睡眠环境布置', '玩具选择使用', '早教游戏设计',
                '语言启蒙方法', '音乐启蒙实践', '运动发展训练', '感官刺激游戏',
                '安全检查实操', '急救技能练习', '行为引导技巧', '综合护理实操'
              ]
            },
            'rehabilitation-therapist': {
              theory: [
                '康复医学概论', '人体解剖学', '生理学基础', '病理学基础',
                '运动学基础', '生物力学', '康复评估理论', '功能评估方法',
                '物理治疗理论', '作业治疗理论', '言语治疗理论', '心理康复理论',
                '神经康复理论', '骨科康复理论', '心肺康复理论', '儿童康复理论',
                '康复工程学', '康复护理学', '社区康复理论', '职业康复理论',
                '康复管理学', '康复伦理学', '康复法律法规', '康复质量控制',
                '循证康复医学', '康复研究方法', '国际康复发展', '康复新技术',
                '疼痛管理理论', '运动处方理论', '康复营养学', '康复心理学'
              ],
              practice: [
                '关节活动度训练', '肌力训练技术', '平衡训练方法', '协调性训练',
                '步态训练技巧', '转移训练方法', '电疗设备操作', '热疗技术应用',
                '冷疗技术操作', '牵引治疗技术', '按摩手法实操', '针灸技术训练',
                '运动疗法实施', '作业活动训练', '日常生活训练', '辅助器具使用',
                '康复评估实操', '功能测试技术', '康复计划制定', '康复记录书写',
                '团队协作实践', '患者教育技巧', '家属指导方法', '社区康复实践',
                '康复安全操作', '应急处理技能', '康复设备维护', '质量监控实操',
                '案例分析实践', '康复效果评估', '多学科协作', '综合康复实操'
              ]
            }
          };

          const topics = baseTopics[course.id as keyof typeof baseTopics];
          const topicList = isTheory ? topics.theory : topics.practice;
          const topic = topicList[(i - 1) % topicList.length];
          
          const duration = `${15 + Math.floor(Math.random() * 25)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          
          videos.push({
            id: `${subCourse.id}-${i}`,
            title: `${typePrefix}课程 ${i}：${topic}`,
            description: `详细讲解${topic}的相关知识和技能要点`,
            duration,
            courseId: course.id,
            courseName: course.name,
            subCourseId: subCourse.id,
            subCourseName: subCourse.name,
            type: subCourse.type,
            episode: i,
            thumbnail: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=400&h=225&fit=crop`,
            videoUrl: "https://www.youtube.com/embed/WUvTyaaNkzM"
          });
        }
      });
    });
    
    return videos;
  };

  const videos = generateVideos();

  // 获取用户已报名的课程
  const enrolledCourses = availableCourses.filter(course => 
    user?.enrolledCourses?.includes(course.id)
  );

  // 处理视频点击
  const handleVideoClick = (video: Video) => {
    if (!hasAccess(video.courseId)) {
      const course = availableCourses.find(c => c.id === video.courseId);
      if (course) {
        alert(`您没有权限访问《${course.name}》课程。`);
      }
      return;
    }
    setSelectedVideo(video);
  };

  // 处理课程选择
  const handleCourseSelect = (courseId: string) => {
    if (!hasAccess(courseId)) {
      const course = availableCourses.find(c => c.id === courseId);
      if (course) {
        alert(`您没有权限访问《${course.name}》课程。`);
      }
      return;
    }
    setSelectedCourse(courseId);
  };

  // 获取课程统计信息
  const getCourseStats = (courseId: string) => {
    const courseVideos = videos.filter(v => v.courseId === courseId);
    const theoryVideos = courseVideos.filter(v => v.type === 'theory').length;
    const practiceVideos = courseVideos.filter(v => v.type === 'practice').length;
    const totalDuration = courseVideos.reduce((total, video) => {
      const [minutes, seconds] = video.duration.split(':').map(Number);
      return total + minutes + (seconds / 60);
    }, 0);
    
    return {
      totalVideos: courseVideos.length,
      theoryVideos,
      practiceVideos,
      totalHours: Math.round(totalDuration / 60 * 10) / 10
    };
  };

  // 视频播放界面
  if (selectedVideo) {
    return (
      <div className="p-6">
        <Button onClick={() => setSelectedVideo(null)} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回视频列表
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <iframe
              src={selectedVideo.videoUrl}
              title={selectedVideo.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl">{selectedVideo.title}</h1>
              <div className="flex space-x-2">
                <Badge variant="secondary">{selectedVideo.courseName}</Badge>
                <Badge variant={selectedVideo.type === 'theory' ? 'default' : 'outline'}>
                  {selectedVideo.type === 'theory' ? '理论课' : '实操课'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {selectedVideo.duration}
              </div>
              <div>第 {selectedVideo.episode} 集</div>
            </div>
            
            <p className="text-gray-700">{selectedVideo.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // 课程详情界面
  if (selectedCourse) {
    const course = availableCourses.find(c => c.id === selectedCourse);
    const courseVideos = videos.filter(v => v.courseId === selectedCourse);
    
    // 过滤视频
    let filteredVideos = courseVideos;
    if (selectedType !== "all") {
      filteredVideos = filteredVideos.filter(v => v.type === selectedType);
    }
    filteredVideos = filteredVideos.filter(video =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button onClick={() => setSelectedCourse(null)} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回课程列表
            </Button>
            <h1 className="text-3xl mt-2">{course?.name}</h1>
            <p className="text-gray-600 mt-1">{course?.description}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索视频课程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedType === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedType("all")}
            >
              全部类型
            </Badge>
            <Badge
              variant={selectedType === "theory" ? "default" : "outline"}
              className="cursor-pointer flex items-center space-x-1"
              onClick={() => setSelectedType("theory")}
            >
              <BookOpen className="h-3 w-3" />
              <span>理论课</span>
            </Badge>
            <Badge
              variant={selectedType === "practice" ? "default" : "outline"}
              className="cursor-pointer flex items-center space-x-1"
              onClick={() => setSelectedType("practice")}
            >
              <Wrench className="h-3 w-3" />
              <span>实操课</span>
            </Badge>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <Card key={video.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <Button
                    size="lg"
                    className="opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => handleVideoClick(video)}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    播放
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant={video.type === 'theory' ? 'default' : 'secondary'} className="text-xs">
                    {video.type === 'theory' ? '理论' : '实操'}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {video.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg text-gray-600">没有找到相关视频</h3>
            <p className="text-gray-500">请尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    );
  }

  // 课程列表界面 - 只显示已报名的课程
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回学习中心
          </Button>
          <h1 className="text-3xl mt-2">视频学习</h1>
          <p className="text-gray-600 mt-1">选择课程开始观看职业培训视频</p>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map(course => {
          const stats = getCourseStats(course.id);
          
          return (
            <Card 
              key={course.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex flex-col"
              onClick={() => handleCourseSelect(course.id)}
            >
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-t-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <Play className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">{course.name}</h3>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {stats.totalVideos} 个视频
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="flex-grow">
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>{stats.theoryVideos} 理论课</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 text-green-600" />
                    <span>{stats.practiceVideos} 实操课</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>{stats.totalHours} 小时</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span>已报名</span>
                  </div>
                </div>
                
                <Button className="w-full">
                  开始学习
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {enrolledCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Play className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg text-gray-600 mb-2">还没有可观看的课程视频</h3>
            <p className="text-gray-500 text-center mb-4">
              请联系课程顾问报名您感兴趣的职业培训课程
            </p>
            <Button onClick={() => window.open('tel:400-123-4567')}>
              联系课程顾问
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}