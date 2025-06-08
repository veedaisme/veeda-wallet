"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "login" | "signup";

export default function AuthForm() {
  const tAuth = useTranslations('auth');
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const queryClient = useQueryClient();

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
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(tAuth('loginSuccess'));
        // Invalidate all queries to ensure fresh data is loaded for the new user
        if (data.user) {
          console.log('Login successful, invalidating queries for user:', data.user.id);
          await queryClient.invalidateQueries();
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) setError(error.message);
      else setSuccess(tAuth('signupSuccess'));
    }
    setLoading(false);
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
          {error && <Alert variant="destructive">{error}</Alert>}
          {success && <Alert variant="default">{success}</Alert>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (mode === "login" ? tAuth('signingIn') : tAuth('signingUp')) : (mode === "login" ? tAuth('signInTitle') : tAuth('signUpTitle'))}
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
