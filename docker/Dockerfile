FROM node:lts-slim

WORKDIR /app

# 安装 p7zip 和 subconverter 运行依赖
RUN apt-get update && apt-get install -y \
    p7zip-full \
    file \
    libpcre2-8-0 \
    ca-certificates \
    libstdc++6 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# 复制所有文件
COPY . .

# 安装依赖并构建前端
RUN npm run build

# 删除前端不必要文件
RUN rm -rf client/src client/node_modules client/package*.json client/vite.config.js client/index.html client/tailwind.config.js client/postcss.config.js client/jsconfig.json client/.gitignore

# 暴露端口
EXPOSE 8103

CMD ["npm", "start"]
