import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { UserProvider } from '@/hooks/useUser';

const inter = Inter({ subsets: ['latin'] });

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'id' }];
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: { locale: 'en' | 'id' } }) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-gray-50`}>
        <UserProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </UserProvider>
      </body>
    </html>
  );
}
