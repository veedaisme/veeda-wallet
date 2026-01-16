import {defineRouting, Pathnames} from 'next-intl/routing';

export const locales = ['en', 'id'] as const;

// Define pathnames for each locale
export const pathnames = {
  // Root path
  '/': '/',

  // Landing page path
  '/landing': {
    en: '/landing',
    id: '/landing' // Using the same path for Indonesian, can be changed later if needed
  }
  // Add other pages here as needed, e.g.,
  // '/dashboard': {
  //   en: '/dashboard',
  //   id: '/dasbor'
  // }
} satisfies Pathnames<typeof locales>;


export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  pathnames // Pass the defined pathnames to the routing configuration
});
