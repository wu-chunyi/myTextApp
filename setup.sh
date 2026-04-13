#!/bin/bash
# ============================================
# Expo CI Builder - 项目初始化脚本
# 用法: chmod +x setup.sh && ./setup.sh
# ============================================

set -e

echo ""
echo "🚀 Expo CI Builder 初始化向导"
echo "================================"
echo ""

# 1. 项目名称
read -p "📦 输入项目名称 (如 my-app): " APP_NAME
if [ -z "$APP_NAME" ]; then
  echo "❌ 项目名称不能为空"
  exit 1
fi

# 2. 包名
read -p "📱 输入包名 (如 com.yourname.myapp): " PACKAGE_NAME
if [ -z "$PACKAGE_NAME" ]; then
  echo "❌ 包名不能为空"
  exit 1
fi

# 3. Expo 用户名
read -p "👤 输入 Expo 用户名 (运行 npx expo whoami 查看): " EXPO_OWNER
if [ -z "$EXPO_OWNER" ]; then
  echo "❌ Expo 用户名不能为空"
  exit 1
fi

echo ""
echo "📋 确认信息:"
echo "   项目名称: $APP_NAME"
echo "   包名:     $PACKAGE_NAME"
echo "   Expo 账号: $EXPO_OWNER"
echo ""
read -p "确认无误? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "❌ 已取消"
  exit 0
fi

echo ""
echo "⏳ 正在配置..."

# 替换 app.json 中的配置
if command -v python3 &> /dev/null; then
  python3 << EOF
import json

with open('app.json', 'r') as f:
    config = json.load(f)

config['expo']['name'] = '$APP_NAME'
config['expo']['slug'] = '$APP_NAME'
config['expo']['ios']['bundleIdentifier'] = '$PACKAGE_NAME'
config['expo']['android']['package'] = '$PACKAGE_NAME'
config['expo']['owner'] = '$EXPO_OWNER'

# 清除旧的 projectId，需要重新 eas init
if 'extra' in config['expo'] and 'eas' in config['expo']['extra']:
    config['expo']['extra']['eas']['projectId'] = 'YOUR_PROJECT_ID'

with open('app.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print('   ✅ app.json 已更新')
EOF
else
  echo "   ⚠️  需要 python3 来更新 app.json，请手动修改"
fi

# 替换 package.json 中的 name
if command -v python3 &> /dev/null; then
  python3 << EOF
import json

with open('package.json', 'r') as f:
    config = json.load(f)

config['name'] = '$APP_NAME'

with open('package.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print('   ✅ package.json 已更新')
EOF
fi

echo ""
echo "🎉 基础配置完成！"
echo ""
echo "📌 接下来还需要手动完成:"
echo ""
echo "   1️⃣  关联 EAS 项目:"
echo "      npx -y eas-cli init"
echo ""
echo "   2️⃣  获取 Expo Token:"
echo "      https://expo.dev/settings/access-tokens"
echo ""
echo "   3️⃣  添加 GitHub Secret:"
echo "      仓库 Settings → Secrets → 添加 EXPO_TOKEN"
echo ""
echo "   4️⃣  推送代码触发构建:"
echo "      git add -A && git commit -m 'init project' && git push"
echo ""
echo "✅ 完成以上步骤后，push 代码即可自动打包！"
echo ""

