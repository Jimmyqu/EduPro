import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './ui/sonner';

import { Section, sectionRoutes, routeSections } from '../types/navigation';

// 定义需要登录的页面路径
const PROTECTED_ROUTES = [
  '/dashboard',
  '/courses',
  '/videos',
  '/pdfs',
  '/exercises',
  '/exams',
  '/profile',
  '/applications',
  '/coursewares'
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 检查用户登录状态和路由保护
  useEffect(() => {
    if (!isLoading) {
      const currentPath = router.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));
      
      // 如果是受保护的路由但用户未登录，重定向到首页
      if (isProtectedRoute && !user) {
        console.log('未登录用户访问受保护页面，重定向到首页');
        router.push('/');
      }
    }
  }, [user, isLoading, router]);
  
  const currentSection = routeSections[router.pathname];
  const isLandingPage = router.pathname === '/';

  const handleNavigate = (section: Section) => {
    router.push(sectionRoutes[section]);
    setMobileMenuOpen(false);
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // 检查当前路由是否需要登录
  const currentPath = router.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <ThemeProvider attribute="class">
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // 如果是受保护的路由但用户未登录，不渲染内容（因为会被重定向）
  if (isProtectedRoute && !user) {
    return (
      <ThemeProvider attribute="class">
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在跳转...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // 如果用户未登录或在首页，不显示导航header
  if (!user || isLandingPage) {
    return (
      <ThemeProvider attribute="class">
        {children}
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 
                  className="text-xl cursor-pointer text-primary hover:text-primary/90 transition-colors"
                  onClick={handleBackToDashboard}
                >
                  教育学习平台
                </h1>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'dashboard'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  仪表板
                </button>
                <button
                  onClick={() => handleNavigate('pdfs')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'pdfs'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  课件
                </button>
                <button
                  onClick={() => handleNavigate('videos')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'videos'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  视频
                </button>
                <button
                  onClick={() => handleNavigate('exercises')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'exercises'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  练习
                </button>
                <button
                  onClick={() => handleNavigate('exams')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'exams'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  模拟考试
                </button>
              </nav>

              {/* User Menu and Mobile Menu Button */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.fullName} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm text-foreground/90">
                    {user.fullName}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <ThemeToggle />
                  
                  <Button
                    onClick={() => handleNavigate('profile')}
                    variant="ghost"
                    size="sm"
                  >
                    <div className={`flex justify-center items-center px-2 py-2 rounded-md text-sm transition-colors ${
                    currentSection === 'profile'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}>
                      <User className="h-4 w-4" />
                        <span className={`hidden sm:inline`} >个人资料</span>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      // 等待logout完成，确保清除所有本地token信息
                      await logout();
                      // 跳转到根路径
                      window.location.href = '/';
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">退出</span>
                  </Button>

                  {/* Mobile Menu Button */}
                  <Button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                  >
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                    currentSection === 'dashboard'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  仪表板
                </button>
                <button
                  onClick={() => handleNavigate('pdfs')}
                  className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                    currentSection === 'pdfs'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  课件
                </button>
                <button
                  onClick={() => handleNavigate('videos')}
                  className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                    currentSection === 'videos'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  视频
                </button>
                <button
                  onClick={() => handleNavigate('exercises')}
                  className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                    currentSection === 'exercises'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  练习
                </button>
                <button
                  onClick={() => handleNavigate('exams')}
                  className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                    currentSection === 'exams'
                      ? 'bg-primary-light text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  模拟考试
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 