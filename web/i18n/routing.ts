import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'id'], // Updated locales

  // Used when no locale matches
  defaultLocale: 'en' // Replace with your actual default locale
});
