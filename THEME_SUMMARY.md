# 主题控制相关文件总结

## 主题配置文件

1. **styles/globals.css**
   - 定义了亮色主题(默认)和深色主题的颜色变量
   - 使用CSS变量定义了所有UI元素的颜色
   - 包含`.dark`类选择器，用于深色模式样式

2. **tailwind.config.js**
   - 配置了`darkMode: ["class"]`，使用类名切换深色模式
   - 将CSS变量映射到Tailwind颜色系统

3. **pages/_app.tsx**
   - 使用`next-themes`库的`ThemeProvider`包装整个应用
   - 设置`attribute="class"`，使用类名切换主题

## 主题切换组件

1. **components/ThemeToggle.tsx** (新创建)
   - 使用`next-themes`库的`useTheme`钩子获取和设置主题
   - 提供了在亮色/深色主题间切换的按钮
   - 使用`Sun`和`Moon`图标表示不同主题

2. **pages/index.tsx** (已修改)
   - 在侧边栏底部添加了主题切换按钮
   - 在登录页面右上角添加了主题切换按钮

## 主题使用

1. **components/ui/sonner.tsx**
   - 使用`useTheme`钩子获取当前主题
   - 将主题信息传递给Sonner组件

## 主题工作原理

1. **初始化**:
   - `ThemeProvider`在应用启动时初始化主题系统
   - 默认使用系统主题偏好，也可以从localStorage读取用户之前的选择

2. **切换主题**:
   - 点击`ThemeToggle`组件中的按钮会调用`setTheme`函数
   - `next-themes`库会自动在`<html>`元素上添加或移除`dark`类
   - 添加`dark`类时，CSS中的`.dark`选择器生效，应用深色主题样式

3. **样式应用**:
   - Tailwind的`dark:`变体会在深色模式下应用特定样式
   - CSS变量在不同主题下有不同的值，组件使用这些变量来适应当前主题

## 使用说明

- 点击太阳/月亮图标可以切换亮色/深色主题
- 主题选择会被保存在localStorage中，下次访问时自动应用
- 组件会自动适应所选主题，无需额外配置 