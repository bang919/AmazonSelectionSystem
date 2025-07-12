/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 为Cloudflare Pages优化
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 如果需要自定义基础路径，取消注释下面这行
  // basePath: '/your-repo-name',
}

module.exports = nextConfig 