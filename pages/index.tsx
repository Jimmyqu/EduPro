import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../components/Dashboard';
import { VideoLibrary } from '../components/VideoLibrary';
import { ExerciseHub } from '../components/ExerciseHub';
import { MockExam } from '../components/MockExam';
import { PDFLibrary } from '../components/PDFLibrary';
import { UserProfile } from '../components/UserProfile';
import { LoginForm } from '../components/LoginForm';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, LogOut, Menu, X } from 'lucide-react';
import { RegisterForm } from '../components/RegisterForm';
import { ThemeToggle } from '../components/ThemeToggle';

type Section = 'dashboard' | 'pdfs' | 'videos' | 'exercises' | 'exams' | 'profile';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
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
  
  const handleNavigate = (section: Section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleBackToDashboard = () => {
    setActiveSection('dashboard');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    );
  }

  return (
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
                  activeSection === 'dashboard'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                仪表板
              </button>
              <button
                onClick={() => handleNavigate('pdfs')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === 'pdfs'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                课件
              </button>
              <button
                onClick={() => handleNavigate('videos')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === 'videos'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                视频
              </button>
              <button
                onClick={() => handleNavigate('exercises')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === 'exercises'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                练习
              </button>
              <button
                onClick={() => handleNavigate('exams')}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === 'exams'
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
                  className="flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">个人资料</span>
                </Button>
                
                <Button
                  onClick={logout}
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
                  activeSection === 'dashboard'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                仪表板
              </button>
              <button
                onClick={() => handleNavigate('pdfs')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  activeSection === 'pdfs'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                课件
              </button>
              <button
                onClick={() => handleNavigate('videos')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  activeSection === 'videos'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                视频
              </button>
              <button
                onClick={() => handleNavigate('exercises')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  activeSection === 'exercises'
                    ? 'bg-primary-light text-primary'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                练习
              </button>
              <button
                onClick={() => handleNavigate('exams')}
                className={`block px-3 py-2 rounded-md text-base w-full text-left transition-colors ${
                  activeSection === 'exams'
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
        {activeSection === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}
        {activeSection === 'pdfs' && (
          <PDFLibrary onBack={handleBackToDashboard} />
        )}
        {activeSection === 'videos' && (
          <VideoLibrary onBack={handleBackToDashboard} />
        )}
        {activeSection === 'exercises' && (
          <ExerciseHub onBack={handleBackToDashboard} />
        )}
        {activeSection === 'exams' && (
          <MockExam onBack={handleBackToDashboard} />
        )}
        {activeSection === 'profile' && (
          <UserProfile onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
} 