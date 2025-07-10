import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ArrowLeft, Search, FileText, Download, Eye, Calendar, Lock, Users, Star, Clock } from "lucide-react";
import { useAuth, availableCourses } from "../contexts/AuthContext";

interface PDFDocument {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  pages: number;
  fileSize: string;
  uploadDate: string;
  thumbnail: string;
  pdfUrl: string;
}

interface PDFLibraryProps {
  onBack: () => void;
}

export function PDFLibrary({ onBack }: PDFLibraryProps) {
  const [selectedPDF, setSelectedPDF] = useState<PDFDocument | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, hasAccess } = useAuth();

  const pdfDocuments: PDFDocument[] = [
    // 健康管理师课件
    {
      id: "hm-pdf-1",
      title: "健康管理师职业标准",
      description: "国家职业技能标准和行业规范要求",
      courseId: "health-manager",
      courseName: "健康管理师",
      pages: 45,
      fileSize: "2.8 MB",
      uploadDate: "2025-01-15",
      thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "hm-pdf-2",
      title: "健康风险评估技术指南",
      description: "健康风险识别、评估和管理的实用手册",
      courseId: "health-manager",
      courseName: "健康管理师",
      pages: 68,
      fileSize: "4.2 MB",
      uploadDate: "2025-01-12",
      thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "hm-pdf-3",
      title: "健康管理师考试大纲",
      description: "最新版本考试大纲和重点内容解读",
      courseId: "health-manager",
      courseName: "健康管理师",
      pages: 32,
      fileSize: "1.9 MB",
      uploadDate: "2025-01-10",
      thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "hm-pdf-4",
      title: "健康教育与促进实务",
      description: "健康教育策略设计和促进活动实施指南",
      courseId: "health-manager",
      courseName: "健康管理师",
      pages: 89,
      fileSize: "6.1 MB",
      uploadDate: "2025-01-08",
      thumbnail: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    // 心理健康指导课件
    {
      id: "mh-pdf-1",
      title: "心理咨询基础理论教材",
      description: "心理咨询的理论基础和基本技术方法",
      courseId: "mental-health-counselor",
      courseName: "心理健康指导",
      pages: 156,
      fileSize: "8.5 MB",
      uploadDate: "2025-01-10",
      thumbnail: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "mh-pdf-2",
      title: "常用心理测评工具手册",
      description: "专业心理测评工具的使用方法和解读技巧",
      courseId: "mental-health-counselor",
      courseName: "心理健康指导",
      pages: 92,
      fileSize: "5.7 MB",
      uploadDate: "2025-01-08",
      thumbnail: "https://images.unsplash.com/photo-1607744986985-4a7e5b7a5dd1?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "mh-pdf-3",
      title: "心理危机干预实务",
      description: "心理危机识别、评估和干预的实践指南",
      courseId: "mental-health-counselor",
      courseName: "心理健康指导",
      pages: 118,
      fileSize: "7.3 MB",
      uploadDate: "2025-01-05",
      thumbnail: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "mh-pdf-4",
      title: "团体心理咨询技术",
      description: "团体咨询的组织、实施和效果评估方法",
      courseId: "mental-health-counselor",
      courseName: "心理健康指导",
      pages: 134,
      fileSize: "8.9 MB",
      uploadDate: "2025-01-03",
      thumbnail: "https://images.unsplash.com/photo-1552581234-26160f608093?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    // 育婴员课件
    {
      id: "cc-pdf-1",
      title: "0-3岁婴幼儿护理指南",
      description: "婴幼儿日常护理、营养喂养的专业指导",
      courseId: "childcare-specialist",
      courseName: "育婴员",
      pages: 78,
      fileSize: "6.3 MB",
      uploadDate: "2025-01-05",
      thumbnail: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "cc-pdf-2",
      title: "婴幼儿早期教育方法",
      description: "科学的早期教育理念和实践方法",
      courseId: "childcare-specialist",
      courseName: "育婴员",
      pages: 64,
      fileSize: "4.1 MB",
      uploadDate: "2025-01-03",
      thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "cc-pdf-3",
      title: "婴幼儿安全防护手册",
      description: "家庭和机构中的婴幼儿安全管理要点",
      courseId: "childcare-specialist",
      courseName: "育婴员",
      pages: 56,
      fileSize: "3.7 MB",
      uploadDate: "2025-01-01",
      thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    // 康复理疗师课件
    {
      id: "rt-pdf-1",
      title: "康复医学基础教程",
      description: "康复医学的基本理论和临床应用",
      courseId: "rehabilitation-therapist",
      courseName: "康复理疗师",
      pages: 189,
      fileSize: "12.4 MB",
      uploadDate: "2025-01-01",
      thumbnail: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "rt-pdf-2",
      title: "物理治疗技术手册",
      description: "常用物理治疗设备和技术的操作指南",
      courseId: "rehabilitation-therapist",
      courseName: "康复理疗师",
      pages: 134,
      fileSize: "9.8 MB",
      uploadDate: "2024-12-28",
      thumbnail: "https://images.unsplash.com/photo-1559757124-3b11c7c28c04?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "rt-pdf-3",
      title: "运动康复治疗学",
      description: "运动康复的理论基础和临床技术",
      courseId: "rehabilitation-therapist",
      courseName: "康复理疗师",
      pages: 201,
      fileSize: "13.7 MB",
      uploadDate: "2024-12-25",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "rt-pdf-4",
      title: "康复评估与测量",
      description: "功能评估工具和测量方法详解",
      courseId: "rehabilitation-therapist",
      courseName: "康复理疗师",
      pages: 167,
      fileSize: "11.2 MB",
      uploadDate: "2024-12-22",
      thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=400&fit=crop",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  ];

  // 处理PDF操作
  const handlePDFAction = (pdf: PDFDocument, action: 'view' | 'download') => {
    if (!hasAccess(pdf.courseId)) {
      const course = availableCourses.find(c => c.id === pdf.courseId);
      if (course) {
        alert(`您没有权限访问《${course.name}》课程的学习课件。`);
      }
      return;
    }

    if (action === 'view') {
      window.open(pdf.pdfUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = pdf.pdfUrl;
      link.download = `${pdf.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
    const coursePDFs = pdfDocuments.filter(pdf => pdf.courseId === courseId);
    const totalPages = coursePDFs.reduce((sum, pdf) => sum + pdf.pages, 0);
    const totalSize = coursePDFs.reduce((sum, pdf) => {
      const size = parseFloat(pdf.fileSize.replace(' MB', ''));
      return sum + size;
    }, 0);
    
    return {
      totalPDFs: coursePDFs.length,
      totalPages,
      totalSize: totalSize.toFixed(1) + ' MB',
      latestUpdate: coursePDFs.length > 0 ? 
        new Date(Math.max(...coursePDFs.map(pdf => new Date(pdf.uploadDate).getTime()))).toLocaleDateString('zh-CN') : ''
    };
  };

  // 获取用户已报名的课程
  const enrolledCourses = availableCourses.filter(course => 
    user?.enrolledCourses?.includes(course.id)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 课程详情界面
  if (selectedCourse) {
    const course = availableCourses.find(c => c.id === selectedCourse);
    const coursePDFs = pdfDocuments.filter(pdf => pdf.courseId === selectedCourse);
    
    // 过滤文档
    const filteredPDFs = coursePDFs.filter(pdf =>
      pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pdf.description.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索学习课件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* PDFs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPDFs.map(pdf => (
            <Card key={pdf.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <div className="relative">
                <img
                  src={pdf.thumbnail}
                  alt={pdf.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">{pdf.courseName}</Badge>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handlePDFAction(pdf, 'view')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      查看
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePDFAction(pdf, 'download')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardHeader className="flex-grow">
                <CardTitle className="text-lg line-clamp-2">{pdf.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {pdf.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {pdf.pages} 页
                  </div>
                  <span>{pdf.fileSize}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(pdf.uploadDate)}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handlePDFAction(pdf, 'view')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePDFAction(pdf, 'download')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPDFs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg text-gray-600">没有找到相关课件</h3>
            <p className="text-gray-500">请尝试调整搜索条件</p>
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
          <h1 className="text-3xl mt-2">学习课件</h1>
          <p className="text-gray-600 mt-1">选择课程查看和下载学习课件</p>
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
                <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500 rounded-t-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">{course.name}</h3>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {stats.totalPDFs} 个课件
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
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{stats.totalPages} 页</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-green-600" />
                    <span>{stats.totalSize}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>最新更新</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span>已报名</span>
                  </div>
                </div>
                
                <Button className="w-full">
                  查看课件
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
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg text-gray-600 mb-2">还没有可下载的学习课件</h3>
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