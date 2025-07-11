import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Play, FileText, BookOpen, ClipboardCheck, Users, Award, TrendingUp, Star } from 'lucide-react';

export default function Home() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // 如果用户已登录，重定向到仪表板
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // 如果用户已登录，显示加载状态
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>正在跳转到仪表板...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: FileText,
      title: "丰富的学习资料",
      description: "提供完整的课程教材、参考文档和学习指南",
      color: "text-blue-600"
    },
    {
      icon: Play,
      title: "高质量视频课程",
      description: "由专业讲师录制的系统性视频教程",
      color: "text-green-600"
    },
    {
      icon: BookOpen,
      title: "互动练习测试",
      description: "通过多样化的练习巩固所学知识",
      color: "text-purple-600"
    },
    {
      icon: ClipboardCheck,
      title: "模拟考试系统",
      description: "真实考试环境模拟，全面评估学习效果",
      color: "text-orange-600"
    }
  ];

  const stats = [
    { number: "10,000+", label: "注册学员", icon: Users },
    { number: "500+", label: "课程资源", icon: BookOpen },
    { number: "95%", label: "通过率", icon: Award },
    { number: "4.8", label: "满意度评分", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-gray-900 dark:via-background dark:to-gray-800">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">教育学习平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
              >
                登录
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
              >
                注册
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            专业的在线
            <span className="text-primary block">教育学习平台</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            提供全面的学习资源、互动练习和模拟考试，助您高效提升专业技能，实现职业发展目标。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowRegister(true)}
              className="text-lg px-8 py-6"
            >
              立即开始学习
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowLogin(true)}
              className="text-lg px-8 py-6"
            >
              已有账号登录
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              为什么选择我们
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              我们提供全方位的学习支持，让您的学习更高效、更系统、更有成效
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      <Icon className={`h-12 w-12 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              值得信赖的学习平台
            </h2>
            <p className="text-xl opacity-90">
              数据见证我们的专业与品质
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stat.number}</div>
                  <div className="text-lg opacity-90">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            准备开始您的学习之旅吗？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            加入我们，获得专业的学习指导和全面的资源支持
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setShowRegister(true)}
            className="text-lg px-8 py-6"
          >
            免费注册账号
          </Button>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">教育学习平台</h3>
            <p className="text-muted-foreground mb-4">
              致力于提供高质量的在线教育服务
            </p>
            <p className="text-muted-foreground text-sm">
              © 2024 教育学习平台. 保留所有权利.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full relative border shadow-lg">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="p-6">
              <LoginForm />
              <p className="text-center mt-4 text-sm text-muted-foreground">
                还没有账号？
                <button 
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  className="text-primary hover:underline ml-1"
                >
                  立即注册
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full relative border shadow-lg">
            <button 
              onClick={() => setShowRegister(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="p-6">
              <RegisterForm onSwitchToLogin={() => {
                setShowRegister(false);
                setShowLogin(true);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 