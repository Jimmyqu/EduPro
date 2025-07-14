# API 集成说明

本项目支持与 `localhost:8000` 后端服务器的集成，可以在真实API和模拟数据之间自动切换。

## 🚀 快速开始

### 1. 启动后端服务器

确保您的后端服务器运行在 `http://localhost:8000`

### 2. API 端点规范

后端服务器需要提供以下API端点：

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册  
- `POST /api/auth/logout` - 用户登出
- `GET /api/health` - 健康检查

#### 用户相关
- `GET /auth/profile` - 获取用户信息
- `PUT /auth/profile` - 更新用户信息
- `POST /auth/change-password` - 修改密码

#### 课程相关
- `GET /courses` - 获取课程列表（支持分页和搜索）
- `GET /courses/{courseId}` - 获取课程详情
- `POST /courses/{courseId}/enroll` - 选课
- `POST /courses/{courseId}/unenroll` - 退课

#### 我的课程
- `GET /my-courses` - 获取我的课程
- `GET /my-courses/{courseId}/progress` - 获取课程学习进度
- `POST /my-courses/{courseId}/courseware/{coursewareId}/progress` - 更新课件学习进度

#### 测试接口
- `GET /test` - 健康检查
- `GET /test/auth` - 认证测试

## 📋 API 请求/响应格式

### 统一响应格式
所有API响应都使用以下统一格式：
```json
{
  "code": 200,        // 状态码：200成功，-1错误
  "data": {},         // 实际数据（成功时）
  "message": "操作成功" // 响应消息
}
```

### 登录请求
```json
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

### 登录响应
```json
{
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "管理员",
      "email": "admin@example.com",
      "avatar_url": null,
      "role": "student",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "欢迎回来，管理员！"
}
```

### 注册请求
```json
POST /auth/register
{
  "username": "newuser",
  "password": "password123",
  "full_name": "新用户",
  "email": "newuser@example.com"
}
```

### 注册响应
```json
{
  "code": 200,
  "data": {
    "user_id": 2,
    "username": "newuser",
    "full_name": "新用户",
    "email": "newuser@example.com",
    "avatar_url": null,
    "role": "student",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "学生 newuser 注册成功！"
}
```

### 错误响应
```json
{
  "code": -1,
  "data": null,
  "message": "用户名或密码错误"
}
```

## 🔧 自动切换机制

应用会在启动时自动检测API服务器的可用性：

- ✅ **API 可用**: 使用真实的后端API
- ❌ **API 不可用**: 自动切换到模拟数据模式
- 🔄 **API 故障**: 运行时故障会自动回退到模拟模式

## 🧪 离线模式说明

当服务器不可用时，应用会自动切换到离线模式。在离线模式下：

- 不支持用户登录和注册
- 显示"请连接到服务器后重试"提示
- 所有功能需要连接到后端服务器才能使用

## 🛠️ 开发配置

### 修改API基础URL

编辑 `lib/api.ts` 文件：

```typescript
const API_BASE_URL = 'http://your-api-server.com:8000';
```

### 强制使用特定模式

```typescript
import { setApiMode } from './lib/apiAdapter';

// 强制使用API模式
setApiMode('api');

// 强制使用模拟模式  
setApiMode('mock');

// 自动检测（默认）
setApiMode('auto');
```

## 📊 调试信息

打开浏览器开发者工具查看：

- API请求日志
- 连接状态
- 错误信息
- 模式切换通知

## 🔐 认证流程

1. 用户输入用户名/密码
2. 前端调用 `/auth/login`
3. 后端验证并返回JWT token
4. 前端存储token并用于后续请求
5. 所有API请求自动包含 `Authorization: Bearer {token}` 头

## 📝 注意事项

- 确保后端支持CORS（跨域请求）
- JWT token会自动存储在localStorage中
- API故障时会显示toast通知
- 模拟模式下的数据仅存储在浏览器本地

## 🚦 状态指示

应用会通过toast通知显示当前状态：

- 🟢 "已连接到服务器" - API模式
- 🟡 "服务器连接失败，已切换到离线模式" - 回退到模拟模式
- 🔵 "正在使用在线数据服务" - API正常工作

## 📞 后端开发建议

如果您正在开发后端API，建议：

1. 实现健康检查端点 `/test`
2. 返回统一的响应格式（code, data, message）
3. 支持JWT认证
4. 启用CORS支持
5. 提供详细的错误信息

示例健康检查响应：

```python
# Django Ninja (推荐)
@api.get("/test")
def health_check(request):
    return {"code": 200, "data": None, "message": "API连接正常"}

# 错误响应示例
@api.post("/auth/login")
def login(request, data: LoginSchema):
    if not valid_credentials:
        return {"code": -1, "data": None, "message": "用户名或密码错误"}
``` 