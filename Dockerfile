# 使用合适的 Node.js 基础镜像
FROM node:14

# 创建应用目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --only=production

# 复制应用代码
COPY . .

# 开放端口
EXPOSE 3000

# 启动命令
CMD [ "node", "app.js" ]