export type Section = 'dashboard' | 'pdfs' | 'videos' | 'exercises' | 'exams' | 'profile';

export const sectionRoutes: Record<Section, string> = {
  dashboard: '/dashboard',
  pdfs: '/pdfs',
  videos: '/videos',
  exercises: '/exercises',
  exams: '/exams',
  profile: '/profile'
};

export const routeSections: Record<string, Section> = {
  '/dashboard': 'dashboard',
  '/pdfs': 'pdfs',
  '/videos': 'videos',
  '/exercises': 'exercises',
  '/exams': 'exams',
  '/profile': 'profile'
}; 