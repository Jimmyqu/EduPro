import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Dashboard } from "./components/Dashboard";
import { VideoLibrary } from "./components/VideoLibrary";
import { ExerciseHub } from "./components/ExerciseHub";
import { MockExam } from "./components/MockExam";
import { PDFLibrary } from "./components/PDFLibrary";
import { UserProfile } from "./components/UserProfile";
import { LoginForm } from "./components/LoginForm";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { User, LogOut, Menu, X } from "lucide-react";

type Section = 'dashboard' | 'pdfs' | 'videos' | 'exercises' | 'exams' | 'profile';

// 更强力的桌面版检测和强制显示
function useForceDesktop() {
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => {
    const checkForceDesktop = () => {
      // 检测是否为移动设备
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 获取各种尺寸信息
      const viewportWidth = window.innerWidth;
      const screenWidth = window.screen.width;
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // 检查是否有大屏幕viewport（通常表示桌面模式）
      const hasLargeViewport = viewportWidth >= 1024;
      
      // 检查CSS媒体查询
      const matchesDesktopQuery = window.matchMedia('(min-width: 1024px)').matches;
      const matchesTabletQuery = window.matchMedia('(min-width: 768px)').matches;
      
      // 检查是否没有触摸支持（可能是桌面模式）
      const hasNoTouch = !('ontouchstart' in window) && !navigator.maxTouchPoints;
      
      // 检查用户代理中是否包含桌面标识
      const hasDesktopUA = userAgent.includes('desktop') || userAgent.includes('x11');
      
      // 检查viewport meta标签设置
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const viewportContent = viewportMeta?.getAttribute('content') || '';
      const hasFixedViewport = viewportContent.includes('width=1024') || viewportContent.includes('width=device-width') === false;
      
      // 多重判断逻辑 - 更强力的检测
      const probablyDesktopMode = (
        // 1. 移动设备但有大viewport（强制桌面模式的主要标识）
        (isMobileDevice && hasLargeViewport) ||
        // 2. CSS媒体查询匹配桌面断点
        matchesDesktopQuery ||
        // 3. 即使是平板尺寸，如果检测到其他桌面特征
        (matchesTabletQuery && (hasNoTouch || hasDesktopUA)) ||
        // 4. 已经设置了固定viewport
        hasFixedViewport ||
        // 5. 屏幕尺寸与viewport差异很大（可能是缩放）
        (isMobileDevice && Math.abs(screenWidth - viewportWidth) > 200)
      );
      
      console.log('Desktop detection:', {
        isMobileDevice,
        viewportWidth,
        screenWidth,
        hasLargeViewport,
        matchesDesktopQuery,
        matchesTabletQuery,
        hasNoTouch,
        probablyDesktopMode
      });
      
      setForceDesktop(probablyDesktopMode);
    };

    // 初始检测
    checkForceDesktop();
    
    // 监听各种变化
    const resizeHandler = () => {
      setTimeout(checkForceDesktop, 100);
    };
    
    const orientationHandler = () => {
      setTimeout(checkForceDesktop, 200);
    };
    
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', orientationHandler);
    
    // 监听viewport变化
    const viewportObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'content') {
          setTimeout(checkForceDesktop, 100);
        }
      });
    });
    
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportObserver.observe(viewportMeta, { attributes: true });
    }
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('orientationchange', orientationHandler);
      viewportObserver.disconnect();
    };
  }, []);

  return forceDesktop;
}

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const forceDesktop = useForceDesktop();

  // 更强力的viewport和样式设置
  useEffect(() => {
    const setDesktopMode = () => {
      // 获取或创建viewport meta标签
      let viewport = document.querySelector("meta[name=viewport]") as HTMLMetaElement;
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        document.head.appendChild(viewport);
      }
      
      if (forceDesktop) {
        console.log('Setting desktop mode');
        // 强制桌面版viewport - 使用更大的固定宽度
        viewport.content = "width=1200, initial-scale=0.8, maximum-scale=3.0, user-scalable=yes";
        
        // 添加强制桌面样式类
        document.documentElement.classList.add('force-desktop');
        document.body.classList.add('force-desktop');
        
        // 强制设置最小宽度
        document.body.style.minWidth = '1200px';
        
        // 添加强制桌面的CSS样式
        const style = document.createElement('style');
        style.id = 'force-desktop-styles';
        style.innerHTML = `
          .force-desktop .md\\:flex { display: flex !important; }
          .force-desktop .md\\:block { display: block !important; }
          .force-desktop .md\\:grid { display: grid !important; }
          .force-desktop .md\\:hidden { display: none !important; }
          .force-desktop .hidden.sm\\:inline { display: inline !important; }
          .force-desktop .hidden.sm\\:block { display: block !important; }
          .force-desktop .max-w-7xl { max-width: 80rem !important; }
          .force-desktop .container { max-width: 1200px !important; }
          .force-desktop .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .force-desktop .sm\\:px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .force-desktop .lg\\:px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
          .force-desktop .space-x-8 > :not([hidden]) ~ :not([hidden]) { margin-left: 2rem !important; }
          .force-desktop .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .force-desktop .grid-cols-1.md\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        `;
        
        // 移除旧的样式
        const oldStyle = document.getElementById('force-desktop-styles');
        if (oldStyle) {
          oldStyle.remove();
        }
        document.head.appendChild(style);
        
      } else {
        console.log('Setting responsive mode');
        // 响应式viewport
        viewport.content = "width=device-width, initial-scale=1.0, user-scalable=yes";
        
        // 移除强制桌面样式类
        document.documentElement.classList.remove('force-desktop');
        document.body.classList.remove('force-desktop');
        document.body.style.minWidth = '';
        
        // 移除强制桌面样式
        const style = document.getElementById('force-desktop-styles');
        if (style) {
          style.remove();
        }
      }
    };

    setDesktopMode();
    
    // 延迟执行确保样式生效
    const timer = setTimeout(setDesktopMode, 100);
    
    return () => clearTimeout(timer);
  }, [forceDesktop]);

  const handleNavigate = (section: string) => {
    setCurrentSection(section as Section);
    setMobileMenuOpen(false);
  };

  const handleBackToDashboard = () => {
    setCurrentSection('dashboard');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 
                className="text-xl cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
                onClick={handleBackToDashboard}
              >
                EduLearn 学习平台
              </h1>
            </div>
            
            {/* Desktop Navigation - 在强制桌面模式下始终显示 */}
            <nav className={`${forceDesktop ? 'flex' : 'hidden md:flex'} space-x-8`}>
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  currentSection === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                仪表板
              </button>
              <button
                onClick={() => handleNavigate('pdfs')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  currentSection === 'pdfs'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                课件
              </button>
              <button
                onClick={() => handleNavigate('videos')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  currentSection === 'videos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                视频
              </button>
              <button
                onClick={() => handleNavigate('exercises')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  currentSection === 'exercises'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                练习
              </button>
              <button
                onClick={() => handleNavigate('exams')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  currentSection === 'exams'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                模拟考试
              </button>
            </nav>

            {/* User Menu and Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <span className={`text-sm text-gray-700 ${forceDesktop ? 'inline' : 'hidden sm:inline'}`}>
                  {user.fullName}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleNavigate('profile')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span className={forceDesktop ? 'inline' : 'hidden sm:inline'}>个人资料</span>
                </Button>
                
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className={forceDesktop ? 'inline' : 'hidden sm:inline'}>退出</span>
                </Button>

                {/* Mobile Menu Button - 只在非强制桌面模式下显示 */}
                {!forceDesktop && (
                  <Button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                  >
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - 只在非强制桌面模式下显示 */}
        {!forceDesktop && mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  currentSection === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                仪表板
              </button>
              <button
                onClick={() => handleNavigate('pdfs')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  currentSection === 'pdfs'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                课件
              </button>
              <button
                onClick={() => handleNavigate('videos')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  currentSection === 'videos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                视频
              </button>
              <button
                onClick={() => handleNavigate('exercises')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  currentSection === 'exercises'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                练习
              </button>
              <button
                onClick={() => handleNavigate('exams')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  currentSection === 'exams'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                模拟考试
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {currentSection === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}
        {currentSection === 'pdfs' && (
          <PDFLibrary onBack={handleBackToDashboard} />
        )}
        {currentSection === 'videos' && (
          <VideoLibrary onBack={handleBackToDashboard} />
        )}
        {currentSection === 'exercises' && (
          <ExerciseHub onBack={handleBackToDashboard} />
        )}
        {currentSection === 'exams' && (
          <MockExam onBack={handleBackToDashboard} />
        )}
        {currentSection === 'profile' && (
          <UserProfile onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}