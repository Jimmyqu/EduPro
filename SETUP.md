# 教育学习平台项目设置指南

## 项目依赖

本项目基于以下技术栈开发：

- Next.js 14.2.0
- React 18.2.0
- TypeScript 5.4.3
- Tailwind CSS 3.4.1
- shadcn/ui 组件库（基于Radix UI）
- Lucide React 图标库
- Recharts 图表库
- Sonner 提示组件

## 目录结构

```
/
├── components/         # React组件
├── contexts/           # React上下文
├── pages/              # Next.js页面
│   ├── _app.tsx        # 应用入口
│   ├── _document.tsx   # HTML文档
│   ├── index.tsx       # 首页
│   └── api/            # API路由
├── styles/             # 样式文件
│   └── globals.css     # 全局样式
├── public/             # 静态资源
├── next.config.js      # Next.js配置
├── tailwind.config.js  # Tailwind CSS配置
├── postcss.config.js   # PostCSS配置
├── tsconfig.json       # TypeScript配置
└── package.json        # 项目依赖
```

## 安装依赖

运行以下命令安装项目依赖：

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

## 运行项目

安装完依赖后，运行以下命令启动开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

然后在浏览器中访问 [http://localhost:3000](http://localhost:3000) 查看项目。

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

## 项目特点

1. **认证系统**：完整的登录/注册功能
2. **响应式设计**：适配移动端和桌面端
3. **主题支持**：明暗主题切换
4. **模块化组件**：使用shadcn/ui组件库
5. **学习进度跟踪**：记录用户学习情况
6. **多媒体支持**：视频、PDF和交互式练习

## 测试账号

用户名: `test`  
密码: `password` 