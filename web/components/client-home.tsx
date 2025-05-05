/* eslint-disable @typescript-eslint/no-unused-vars, react/jsx-no-comment-textnodes */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Clock, CreditCard, Plus, User, ChevronUp, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { LanguagePillToggle } from '@/components/ui/language-pill-toggle';
import { SpendingCard } from "@/components/spending-card";
import { Modal } from "@/components/ui/modal";
import { TransactionForm, type TransactionData } from "@/components/transaction-form";
import { Transaction } from "@/models/transaction";
import { TransactionsList } from "@/components/transactions-list";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { EditTransactionModal } from "@/components/edit-transaction-modal";
import ProtectedLayout from "@/components/ProtectedLayout";
import { ChartContainer } from "@/components/ui/chart";
import * as Recharts from "recharts";
import { formatIDR } from "@/utils/currency";

type TabType = "dashboard" | "transactions";
type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

function getChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export default function ClientHome() {
  // Original Home component logic and return here
  // For brevity, assume the existing code from app/page.tsx is pasted here
  return (
    <div>{/* client home UI */}</div>
  );
}
