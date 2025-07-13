import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TERMS_CONTENT, getTermsSectionKeys } from '@/lib/termsContent';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Veeda Wallet',
  description: 'Terms and Conditions for using Veeda Wallet application',
};

export default function TermsPage() {
  const sectionKeys = getTermsSectionKeys();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/auth">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground">
              Version {TERMS_CONTENT.version} • Effective {TERMS_CONTENT.effectiveDate}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {TERMS_CONTENT.lastUpdated}
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sectionKeys.map((key) => (
                <Link
                  key={key}
                  href={`#${key}`}
                  className="text-primary hover:underline text-sm py-1"
                >
                  {TERMS_CONTENT.sections[key].title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <div className="space-y-8">
          {sectionKeys.map((key, index) => {
            const section = TERMS_CONTENT.sections[key];
            return (
              <Card key={key} id={key} className="scroll-mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {section.content.split('\n').map((paragraph, pIndex) => {
                      if (paragraph.trim() === '') return null;
                      
                      // Handle bullet points
                      if (paragraph.trim().startsWith('•')) {
                        return (
                          <li key={pIndex} className="ml-4 mb-2">
                            {paragraph.trim().substring(1).trim()}
                          </li>
                        );
                      }
                      
                      return (
                        <p key={pIndex} className="mb-4 leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-6" />
          <p className="text-sm text-muted-foreground mb-4">
            By using Veeda Wallet, you acknowledge that you have read and understood these Terms and Conditions.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth">
              <Button>
                Return to Sign Up
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline">
                Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}