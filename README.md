# 📦 Expo CI Builder

> 一个开箱即用的 Expo App 自动打包模板，基于 GitHub Actions + EAS Build Local。

**告别本地打包的痛苦** — Push 代码，自动出 APK。

## ✨ 特性

- 🔄 Push 代码自动构建 Android APK
- 🍎 支持 iOS 构建（需 Apple 开发者账号）
- ⚡ Gradle / CocoaPods 缓存加速，二次构建更快
- 📱 构建产物自动上传至 GitHub Artifacts，一键下载
- 🛠 一键初始化脚本，Fork 后快速配置
- 💰 完全免费（公开仓库 GitHub Actions 无限制）

## 🚀 快速开始

### 1. Fork 此项目

点击右上角 **Fork** 按钮，fork 到你自己的 GitHub 账号。

### 2. Clone 到本地

```bash
git clone https://github.com/你的用户名/expo-ci-demo.git
cd expo-ci-demo
npm install
```

### 3. 运行初始化脚本

```bash
chmod +x setup.sh
./setup.sh
```

按提示输入你的项目名称、包名、Expo 用户名即可。

### 4. 关联 EAS 项目

```bash
npx -y eas-cli init
```

### 5. 配置 EXPO_TOKEN

1. 前往 [Expo Access Tokens](https://expo.dev/settings/access-tokens) 创建 Token
2. 前往你的仓库 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
   - Name: `EXPO_TOKEN`
   - Secret: 粘贴你的 Token

### 6. Push 代码，自动打包！

```bash
git add -A
git commit -m "init: my awesome app"
git push
```

前往仓库的 **Actions** 页面查看构建进度，完成后在 Artifacts 下载 APK。

## 📁 项目结构

```
├── App.js                          # 应用入口
├── app.json                        # Expo 配置 ⚠️ 需修改
├── eas.json                        # EAS 构建配置
├── setup.sh                        # 一键初始化脚本
├── .github/
│   └── workflows/
│       └── build-android.yml       # CI/CD 流水线
└── assets/                         # 图标和启动图
```

## ⚙️ 需要修改的配置

| 文件 | 字段 | 说明 |
|------|------|------|
| `app.json` | `expo.name` | 你的 App 名称 |
| `app.json` | `expo.slug` | 项目标识（URL 友好） |
| `app.json` | `expo.android.package` | Android 包名，如 `com.yourname.myapp` |
| `app.json` | `expo.ios.bundleIdentifier` | iOS Bundle ID，通常和包名一致 |
| `app.json` | `expo.owner` | 你的 Expo 用户名 |
| `app.json` | `extra.eas.projectId` | 运行 `eas init` 后自动填入 |

> 💡 使用 `./setup.sh` 可以一键完成以上配置。

## 🔨 构建配置说明

`eas.json` 中有三个构建 Profile：

| Profile | 用途 | 产物 |
|---------|------|------|
| `development` | 开发调试 | 带 dev tools 的 APK |
| `preview` | 内部测试 | 普通 APK（默认） |
| `production` | 发布上架 | AAB（Google Play 格式） |

## 🍎 iOS 构建说明

iOS 构建需要额外条件：

- Apple Developer 账号（$99/年）
- 在 Actions 页面手动触发时选择 `ios` 或 `all`
- 首次构建会自动生成签名证书（EAS 管理）

> ⚠️ iOS 构建使用 macOS runner，私有仓库消耗 10x GitHub Actions 分钟数。

## ⏱ 构建耗时参考

| 场景 | Android | iOS |
|------|---------|-----|
| 首次构建（无缓存） | ~12-15 分钟 | ~20-25 分钟 |
| 二次构建（有缓存） | ~5-7 分钟 | ~10-15 分钟 |

## 🔗 手动触发构建

1. 前往仓库 **Actions** 页面
2. 左侧选择 **Build App**
3. 点击 **Run workflow**
4. 选择平台：`android` / `ios` / `all`

## ❓ 常见问题

**Q: 构建失败怎么办？**
A: 检查 Actions 日志，常见原因：1) EXPO_TOKEN 未配置 2) eas init 未执行 3) 包名格式不对

**Q: 如何只在打 tag 时构建？**
A: 修改 `.github/workflows/build-android.yml`，将 push 触发改为：
```yaml
on:
  push:
    tags:
      - 'v*'
```

**Q: 怎么添加 OTA 热更新？**
A: 安装 `expo-updates`，然后用 `eas update` 命令推送 JS 更新，用户无需重新安装。

## 📜 License

MIT

> ⚠️ iOS 构建使用 macOS runner，私有仓库消耗 10x GitHub Actions 分钟数。

