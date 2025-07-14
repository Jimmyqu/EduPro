import { apiService, checkApiConnection, setAuthToken, isApiSuccess, ApiResponse, LoginData, User as ApiUser } from './api';
import { User } from '../contexts/AuthContext';
import { toast } from 'sonner';

// API模式配置
export type ApiMode = 'api' | 'mock' | 'auto';

// 适配器状态
let currentApiMode: ApiMode = 'auto'; // 默认自动检测
let isApiAvailable = false;

// 检查API是否可用
export async function initializeApiMode(): Promise<ApiMode> {
  try {
    isApiAvailable = await checkApiConnection();
    
    if (currentApiMode === 'auto') {
      currentApiMode = isApiAvailable ? 'api' : 'mock';
    }
    
    console.log(`API Mode: ${currentApiMode}, API Available: ${isApiAvailable}`);
    
    if (currentApiMode === 'api' && isApiAvailable) {
      toast.success('已连接到服务器', {
        description: '正在使用在线数据服务',
        duration: 3000,
      });
    } else if (currentApiMode === 'api' && !isApiAvailable) {
      toast.warning('服务器连接失败', {
        description: '已切换到离线模式',
        duration: 4000,
      });
      currentApiMode = 'mock';
    }
    
    return currentApiMode;
  } catch (error) {
    console.error('Failed to initialize API mode:', error);
    currentApiMode = 'mock';
    return currentApiMode;
  }
}

// 设置API模式
export function setApiMode(mode: ApiMode) {
  currentApiMode = mode;
  console.log(`API Mode set to: ${mode}`);
}

// 获取当前API模式
export function getCurrentApiMode(): ApiMode {
  return currentApiMode;
}

// 将后端用户数据转换为前端用户数据
function convertApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.user_id.toString(),
    username: apiUser.username,
    email: apiUser.email || '',
    fullName: apiUser.full_name,
    joinDate: apiUser.created_at,
    avatar: apiUser.avatar_url,
    studyStats: {
      videosWatched: 0,
      exercisesCompleted: 0,
      pdfsRead: 0,
      studyHours: 0,
    },
    enrolledCourses: [], // 需要从其他接口获取
    courseProgress: [],
    courseEnrollments: [],
    exerciseProgress: [],
    mockExamProgress: [],
    mockExamAttempts: [],
    preferences: {
      preferredSubjects: [],
      difficulty: 'Medium',
    },
  };
}

// 统一的API适配器
export const apiAdapter = {
  // 用户登录
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    if (currentApiMode === 'mock') {
      return this.mockLogin(username, password);
    }

    try {
      const response = await apiService.login({ username, password });
      
      if (isApiSuccess(response) && response.data) {
        const { access_token, user: apiUser } = response.data;
        const user = convertApiUserToUser(apiUser);
        
        // 保存token
        setAuthToken(access_token);
        
        toast.success('登录成功', {
          description: `欢迎回来，${user.fullName}！`,
          duration: 3000,
        });
        
        return {
          success: true,
          user,
          token: access_token,
        };
      } else {
        const errorMsg = response.message || '登录失败';
        toast.error('登录失败', {
          description: errorMsg,
          duration: 4000,
        });
        
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // API调用失败，尝试切换到mock模式
      if (currentApiMode === 'auto') {
        toast.warning('服务器连接失败', {
          description: '正在切换到离线模式...',
          duration: 3000,
        });
        currentApiMode = 'mock';
        return this.mockLogin(username, password);
      }
      
      const errorMsg = error instanceof Error ? error.message : '网络连接失败';
      toast.error('登录失败', {
        description: errorMsg,
        duration: 4000,
      });
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  // 用户注册
  async register(userData: { username: string; email: string; fullName: string; password: string }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    if (currentApiMode === 'mock') {
      return this.mockRegister(userData);
    }

    try {
      const response = await apiService.register({
        username: userData.username,
        password: userData.password,
        full_name: userData.fullName,
        email: userData.email,
      });
      
      if (isApiSuccess(response) && response.data) {
        const user = convertApiUserToUser(response.data);
        
        toast.success('注册成功', {
          description: `欢迎加入，${user.fullName}！`,
          duration: 3000,
        });
        
        return {
          success: true,
          user,
        };
      } else {
        const errorMsg = response.message || '注册失败';
        toast.error('注册失败', {
          description: errorMsg,
          duration: 4000,
        });
        
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      
      // API调用失败，尝试切换到mock模式
      if (currentApiMode === 'auto') {
        toast.warning('服务器连接失败', {
          description: '正在切换到离线模式...',
          duration: 3000,
        });
        currentApiMode = 'mock';
        return this.mockRegister(userData);
      }
      
      const errorMsg = error instanceof Error ? error.message : '网络连接失败';
      toast.error('注册失败', {
        description: errorMsg,
        duration: 4000,
      });
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  // 用户登出
  async logout(): Promise<void> {
    if (currentApiMode === 'api') {
      try {
        await apiService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // 清除本地token
    setAuthToken(null);
    
    toast.success('已安全退出', {
      duration: 2000,
    });
  },

  // Mock登录（离线模式）
  mockLogin(username: string, password: string): { success: boolean; user?: User; error?: string } {
    toast.error('离线模式暂不支持登录', {
      description: '请连接到服务器后重试',
      duration: 3000,
    });
    
    return {
      success: false,
      error: '离线模式暂不支持登录',
    };
  },

  // Mock注册（离线模式）
  mockRegister(userData: { username: string; email: string; fullName: string; password: string }): { success: boolean; user?: User; error?: string } {
    toast.error('离线模式暂不支持注册', {
      description: '请连接到服务器后重试',
      duration: 3000,
    });

    return {
      success: false,
      error: '离线模式暂不支持注册',
    };
  },
};

// 初始化API
export async function initializeApi(): Promise<void> {
  await initializeApiMode();
} 