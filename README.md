# 教育学习平台

这是一个基于Next.js和React开发的教育学习平台，提供视频课程、PDF资料、练习题和模拟考试等功能。

## 功能特点

- 用户认证（登录/注册）
- 个人仪表盘
- 视频课程库
- PDF资料库
- 练习题系统
- 模拟考试
- 个人学习进度跟踪
- 响应式设计，支持移动端和桌面端

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库
- Lucide React 图标
- Recharts 图表库

## 安装与运行

1. 克隆项目

```bash
git clone <repository-url>
cd educational-learning-platform
```

2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 构建生产版本

```bash
npm run build
npm start
# 或
yarn build
yarn start
# 或
pnpm build
pnpm start
```

## 项目结构

- `/components` - React组件
- `/contexts` - React上下文（如认证上下文）
- `/pages` - Next.js页面
- `/styles` - 全局样式
- `/public` - 静态资源

## 使用说明

请确保后端服务器正在运行，然后通过注册功能创建账户或使用现有账户登录。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

[MIT](LICENSE) 