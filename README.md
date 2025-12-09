# SubManager

订阅链接管理与转换工具，支持多订阅合并、格式转换等功能。

## 功能特性

- 订阅链接管理（添加、删除、编辑）
- 多订阅合并为单一链接
- 支持自定义订阅转换后端
- 支持自定义转换规则配置
- 节点过滤（排除关键词）

## 技术栈

**后端**: Node.js + Express
**前端**: Vue 3 + Vite + TailwindCSS

## 快速开始

### 1. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `8103` |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `admin` |
| `JWT_SECRET` | JWT 签名密钥 | `default_jwt_secret_key` |
| `SUB_API_TOKEN` | 订阅 API 访问令牌 | `default_sub_api_token` |

### 2. 安装依赖并构建

```bash
npm run build
```

### 3. 启动服务

```bash
# 生产模式
npm start

# 开发模式（热重载）
npm run dev
```

服务启动后访问 `http://localhost:8103`

## Docker 部署

### 使用 Docker Compose（推荐）

```bash
cd docker
docker compose up -d
```

或自定义 `docker-compose.yml`：

```yaml
services:
  sub-manager:
    container_name: sub-manager
    image: rfym21/sub-manager:latest
    restart: always
    ports:
      - "8103:8103"
    volumes:
      - ./files:/app/files
      - ./config:/app/src/config
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your_password
      - JWT_SECRET=your_jwt_secret
      - SUB_API_TOKEN=your_api_token
      - PORT=8103
```

### 使用 Docker 命令

```bash
docker pull rfym21/sub-manager:latest

docker run -d \
  -p 8103:8103 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e SUB_API_TOKEN=your_api_token \
  -v /path/to/config:/app/src/config \
  -v /path/to/files:/app/files \
  rfym21/sub-manager:latest
```

### 本地构建

```bash
docker build -t sub-manager -f docker/Dockerfile .

docker run -d -p 8103:8103 sub-manager
```

## 配置说明

首次启动会自动生成 `src/config/config.json` 配置文件，可通过管理界面修改：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `host` | 服务访问地址 | `http://localhost:8103` |
| `subconverter` | 订阅转换后端地址 | `https://api.v1.mk` |
| `sub_config` | 转换规则配置 URL | ACL4SSR 规则 |
| `exclude` | 节点排除关键词 | 空 |
| `filename` | 导出文件名 | `mySubs` |
| `sub_links` | 订阅链接列表 | `[]` |

## 项目结构

```
SubManager/
├── client/                 # 前端项目
│   ├── src/
│   └── dist/              # 构建产物
├── src/                   # 后端项目
│   ├── config/            # 配置管理
│   ├── routes/            # API 路由
│   └── index.js           # 入口文件
├── docker/                # Docker 相关
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/workflows/     # CI/CD
│   └── docker-build.yml
├── .env.example           # 环境变量示例
└── package.json
```