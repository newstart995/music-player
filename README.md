# music-player
# Cloudflare Pages Music Player

基于 Cloudflare Pages + R2 + 七牛云 Kodo 构建的个人无服务器音乐播放平台。

## Cloudflare Pages 环境变量配置说明

请在 Pages 项目控制台 **Settings -> Variables and bindings** 中设置以下内容：

### 1. R2 Bucket Bindings (存储桶绑定)
* **Variable name**: `MUSIC_CACHE`
* **R2 Bucket**: 选择你创建的缓存桶 (例如 `music-cache`)

### 2. Environment Variables (环境变量)
* `QINIU_BUCKET`: 你的七牛云空间名（如 `my-music-bucket`）
* `QINIU_DOMAIN`: 你的七牛云 CDN 加速域名（如 `https://music-cdn.yourdomain.com`）
* `QINIU_AK`: 七牛云 AccessKey
* `QINIU_SK`: 七牛云 SecretKey
