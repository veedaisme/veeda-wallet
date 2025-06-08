"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { invalidationKeys } from "@/lib/queryKeys";

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      const previousUser = user;
      setSession(session);
      setUser(session?.user ?? null);

      // Invalidate and refetch user-specific queries when auth state changes
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, invalidating queries for user:', session.user.id);
        // Invalidate all user-specific queries
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey.includes('dashboard') ||
                   queryKey.includes('transactions') ||
                   queryKey.includes('subscriptions');
          }
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing all queries');
        // Clear all queries when user signs out
        queryClient.clear();
      }
    });
    const subscription = data.subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, user]);

  return (
    <UserContext.Provider value={{ user, session, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
