export type Section = 'dashboard' | 'courses' | 'coursewares' | 'applications' | 'pdfs' | 'videos' | 'exercises' | 'exams' | 'profile';

export const sectionRoutes: Record<Section, string> = {
  dashboard: '/dashboard',
  courses: '/courses',
  coursewares: '/coursewares',
  applications: '/applications',
  pdfs: '/pdfs',
  videos: '/videos',
  exercises: '/exercises',
  exams: '/exams',
  profile: '/profile'
};

export const routeSections: Record<string, Section> = {
  '/dashboard': 'dashboard',
  '/courses': 'courses',
  '/coursewares': 'coursewares',
  '/applications': 'applications',
  '/pdfs': 'pdfs',
  '/videos': 'videos',
  '/exercises': 'exercises',
  '/exams': 'exams',
  '/profile': 'profile'
}; 