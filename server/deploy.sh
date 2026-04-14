#!/bin/bash
set -e

# ============================================
#  MyTestApp 一键部署脚本
#
#  使用方法（在服务器上执行）：
#  1. git clone 你的仓库
#  2. cd my-test-app/server
#  3. cp .env.production .env
#  4. 编辑 .env 填入你的域名和密码
#  5. bash deploy.sh
# ============================================

echo "🚀 MyTestApp 部署开始..."

# ---- 1. 检查 Docker ----
if ! command -v docker &> /dev/null; then
  echo "📦 安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER
fi

echo "🔧 配置 Docker 镜像加速..."
sudo mkdir -p /etc/docker
sudo cp daemon.json /etc/docker/daemon.json
sudo systemctl restart docker

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "📦 安装 Docker Compose..."
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# ---- 2. 检查 .env ----
if [ ! -f .env ]; then
  echo "⚠️  未找到 .env 文件"
  echo "   请执行: cp .env.production .env"
  echo "   然后编辑 .env 填入你的配置"
  exit 1
fi

source .env

if [ "$API_DOMAIN" = "api.yourdomain.com" ]; then
  echo "⚠️  请先修改 .env 中的 API_DOMAIN 为你的真实域名"
  exit 1
fi

echo "📋 域名: $API_DOMAIN"

# ---- 3. 构建并启动 ----
echo "🔨 构建镜像..."
docker compose build --no-cache

echo "🗄️  启动数据库..."
docker compose up -d db
sleep 5

echo "📊 初始化数据库..."
docker compose run --rm api npx prisma db push

echo "🚀 启动全部服务..."
docker compose up -d

echo ""
echo "✅ =============================="
echo "✅  部署完成！"
echo "✅  API: https://$API_DOMAIN"
echo "✅  健康检查: https://$API_DOMAIN/health"
echo "✅ =============================="
echo ""
echo "📝 常用命令:"
echo "   查看日志: docker compose logs -f api"
echo "   重启服务: docker compose restart"
echo "   停止服务: docker compose down"
echo "   更新部署: git pull && bash deploy.sh"
