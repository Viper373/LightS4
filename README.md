# 🌈Light-S4·微光小溪

## 项目概述 🌟

Light-S4·微光小溪是一个基于 Next.js 的 S3 兼容存储服务浏览器，允许用户浏览、查看和管理存储在 S3 兼容存储服务中的文件，特别是视频文件。该应用提供了直观的用户界面，支持视频预览、缩略图显示和元数据展示。

## 项目截图 📸
![Light-S4·微光小溪](screenshots/demo.png)

## 功能特点 ✨

- 🏠 美观的首页设计，带有渐变背景和现代UI元素
- 🎨 顶部导航栏，提供便捷的页面切换
- 🌓 内置暗色/亮色模式切换功能
- 🗂️ 文件和目录浏览
- 🎬 视频文件在线播放
- 🖼️ 视频缩略图预览
- 📊 显示文件元数据（大小、修改日期、观看次数、时长）
- 🔄 浏览历史记录（前进/后退导航）
- 🍞 面包屑导航
- 🔍 与 MongoDB 集成获取视频元数据
- 🚀 优化的API请求缓存机制

## 技术栈 🛠️

- **前端框架**: Next.js
- **S3 客户端**: AWS SDK for JavaScript v3
- **后端**: FastAPI (Python)
- **数据库**: MongoDB
- **缓存**: FastAPI Cache
- **样式**: Tailwind CSS
- **UI组件**: 自定义组件 + Lucide React图标
- **部署**: Vercel

## 项目结构 📂

```
Light-S4/
├── .env.example          # 环境变量示例配置
├── .eslintrc.js          # ESLint 配置
├── .gitignore            # Git 忽略文件配置
├── api.py                # FastAPI 后端入口点
├── LINCENSE              # 许可证文件
├── Procfile              # 部署配置
├── README.md             # 项目说明文档
├── package.json          # NPM 包配置
├── requirements.txt      # Python 依赖配置
├── vercel.json           # Vercel 部署配置
├── file-manager.tsx      # 文件管理器组件
├── app/                  # Next.js 应用目录
│   ├── layout.tsx        # 全局布局组件
│   ├── page.tsx          # 首页组件
│   ├── globals.css       # 全局样式
│   ├── file-manager/     # 文件管理器页面
│   └── video-station/    # 视频站页面
├── components/           # 共享组件
│   └── Header.tsx        # 顶部导航栏组件
└── screenshots/          # 截图目录
    └── demo.png          # 演示截图
```

## 环境变量 🔐

项目使用以下环境变量进行配置（参考 `.env.example`）：

| 变量名                      | 描述           | 示例值                               |
|--------------------------|--------------|-----------------------------------|
| NEXT_PUBLIC_S3_ENDPOINT      | S3 服务端点      | https://s3.bitiful.net            |
| NEXT_PUBLIC_S3_REGION        | S3 区域        | cn-east-1                         |
| NEXT_PUBLIC_S3_ACCESS_KEY    | S3 访问密钥      | CYVLn8lssikCoSjACGCpqiO3gOg       |
| NEXT_PUBLIC_S3_SECRET_KEY    | S3 秘密密钥      | gEKcmCVe12aVnb5jZ10MfBh3GcYXKHMWQ |
| NEXT_PUBLIC_S3_BUCKET        | S3 存储桶名称     | viper3                            |
| NEXT_PUBLIC_S3_DOMAIN        | S3 初始访问域名    | viper3.s3.bitiful.net             |
| NEXT_PUBLIC_S3_CUSTOM_DOMAIN | S3自定义域名      | bitiful.viper3.top                |
| NEXT_PUBLIC_IMG_CDN          | 图床CDN        | https://cdn.jsdelivr.net/gh       |
| NEXT_PUBLIC_GH_OWNER         | Github用户名    | Viper373                          |
| NEXT_PUBLIC_GH_REPO          | 图床Github仓库名称 | picx-images-hosting               |
| MONGODB_URI      | MongoDB连接URI | mongodb://localhost:27017/        |
| DB_NAME          | 数据库名称        | XOVideos                          |
| COL_NAME         | 集合名称         | pornhub                           |

## Vercel部署 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Viper373/Light-S4)

点击上方的"Deploy with Vercel"按钮，可以一键将项目部署到Vercel平台。
部署后，您可以通过以下路径访问不同的服务：

- **前端应用**: `https://your-vercel-domain.vercel.app/`
- **API服务**: `https://your-vercel-domain.vercel.app/api/`

在Vercel部署时，需要配置以下环境变量：

1. 在Vercel项目设置中，找到"Environment Variables"部分
2. 添加所有必要的环境变量（参考上面的环境变量表）
3. 确保敏感信息（如S3密钥和MongoDB URI）已正确设置

## 本地开发环境部署 🚀

### 前端部署

```bash
# 克隆仓库
git clone https://github.com/Viper373/Light-S4.git
cd Light-S4

# 创建并配置环境变量
# 在本地创建 `.env.local` 文件，并添加必要的环境变量（参考上面的环境变量表）

# 安装依赖并启动前端服务
npm install
npm run dev
```

### 后端部署

```bash
# 安装依赖
pip install -r requirements.txt

# 运行后端服务（端口 8000）
uvicorn api:app --reload --port 8000
```

## 私有部署 🚀

### 前端

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 启动生产服务
npm run start
```

### 后端

```bash
# 安装依赖
pip install -r requirements.txt

# 运行后端服务（端口 8000）
uvicorn api:app
```

## API 接口说明 📚

- **GET /api/xovideos**: 获取视频元数据
    - 参数: `author` (可选) - 按作者筛选视频
    - 返回: 包含视频标题、观看次数和时长的 JSON 数据
  ```json
  {
  "status": "success",
  "data": [
      {
        "author": "作者名称",
        "video_title": "视频标题",
        "video_views": "观看次数",
        "duration": "视频时长"
      }
    ]
  }
  ```
- **GET /api/health**: 检查后端服务健康状态
    - 返回: 包含状态信息的 JSON 数据
  ```json
  {
    "status": "healthy"
  }
  ```

- **GET /api/mongodb-status**: 检查 MongoDB 连接状态
    - 返回: 包含 MongoDB 连接状态的 JSON 数据
  ```json
  {
    "mongodb_uri": "已设置",
    "db_name": "已设置",
    "col_name": "已设置",
    "connection_status": "已连接",
    "collection_count": 43,
    "sample_document": { ... },
    "metadata_count": 86
  }
  ```

## MongoDB 数据结构 🗃️

```json
  {
  "作者名称": "作者名称",
  "作者ID": "作者ID",
  "作者主页": "作者主页URL",
  "作者头像": "头像URL",
  "作者视频列表": [
    {
      "视频标题": "视频标题",
      "视频封面": "封面URL",
      "视频链接": "视频URL",
      "下载链接": "下载URL",
      "视频时长": "时长",
      "视频观看次数": "观看次数",
      "下载状态": 0,
      "封面状态": 0
    }
  ],
  "作者视频数量": 6
}
```

## TODO ✈

- 实现视频搜索功能
- 实现文件上传功能
- 添加视频转码功能
- 优化移动端体验
- 添加更多自定义主题

## 贡献指南 👥

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证 📄

本项目采用 [MIT 许可证](LINCENSE) 。

## 联系方式 📧

2483523414@qq.com

---

⭐ 如果您觉得这个项目有用，请给它一个star星标！