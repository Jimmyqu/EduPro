/** @type {import('next').NextConfig} */
const getNextConfig = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    reactStrictMode: true,
    swcMinify: true,
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    ...(isProd ? {
      output: 'export',
      assetPrefix: '/static/edupro',
      basePath: '/static/edupro',
    } : {}),
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
}

module.exports = getNextConfig(); 