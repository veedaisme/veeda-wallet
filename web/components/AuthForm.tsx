"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { TermsService } from "@/lib/termsService";
import { CURRENT_TERMS_VERSION } from "@/lib/termsContent";

type Mode = "login" | "signup";

export default function AuthForm() {
  const tAuth = useTranslations('auth');
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (success && mode === "login") {
      // Redirect after a short delay to allow the success message to show
      const timeout = setTimeout(() => {
        router.replace("/");
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [success, mode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms acceptance for signup
    if (mode === "signup" && !agreedToTerms) {
      setError("You must accept the terms and conditions to proceed");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) throw error;
        setSuccess(tAuth('loginSuccess'));
      } else {
        // Sign up user first
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        
        if (error) throw error;
        
        // Accept terms after successful signup
        if (data.user) {
          setIsAcceptingTerms(true);
          try {
            await TermsService.acceptTerms(
              data.user.id,
              CURRENT_TERMS_VERSION,
              navigator.userAgent
            );
          } catch (termsError) {
            console.error('Failed to accept terms:', termsError);
            // Continue with signup success even if terms acceptance fails
            // This prevents blocking user signup due to terms service issues
          }
        }
        
        setSuccess(tAuth('signupSuccess'));
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setIsAcceptingTerms(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-left">{mode === "login" ? tAuth('signInTitle') : tAuth('signUpTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <Label htmlFor="email">{tAuth('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="password">{tAuth('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          {/* Terms and Conditions Checkbox (signup only) */}
          {mode === "signup" && (
            <div className="flex items-start space-x-3 py-2">
              <Checkbox
                id="terms-checkbox"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                required
                disabled={loading}
                aria-describedby="terms-description"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms-checkbox"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the Terms and Conditions
                </label>
                <p id="terms-description" className="text-xs text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          )}

          {error && <Alert variant="destructive">{error}</Alert>}
          {success && <Alert variant="default">{success}</Alert>}
          
          <Button type="submit" className="w-full" disabled={loading || (mode === "signup" && !agreedToTerms)}>
            {loading || isAcceptingTerms ? (
              mode === "login" ? tAuth('signingIn') : 
              isAcceptingTerms ? "Accepting Terms..." :
              tAuth('signingUp')
            ) : (
              mode === "login" ? tAuth('signInTitle') : tAuth('signUpTitle')
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-gray-500 hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            disabled={loading}
          >
            {mode === "login"
              ? tAuth('dontHaveAccount')
              : tAuth('alreadyHaveAccount')}
          </button>
        </div>
      </Card>
    </div>
  );
}
