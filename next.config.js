/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: '/static/edupro',
  basePath: '/static/edupro',
  // Exclude dynamic routes from export
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
      '/dashboard': { page: '/dashboard' },
      '/courses': { page: '/courses' },
      '/videos': { page: '/videos' },
      '/pdfs': { page: '/pdfs' },
      '/exercises': { page: '/exercises' },
      '/exams': { page: '/exams' },
      '/profile': { page: '/profile' },
      '/applications': { page: '/applications' },
      '/coursewares': { page: '/coursewares' }
    };
  }
}

module.exports = nextConfig 