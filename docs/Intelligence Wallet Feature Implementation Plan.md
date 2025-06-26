# Intelligence Wallet Feature Implementation Plan

## Overview

This document outlines the technical implementation plan for the "Intelligence for the Wallet" feature in the Veeda Wallet application. This feature will provide personalized financial insights through interactive quiz cards that educate users on wise spending habits, leveraging existing transaction and subscription data.

## Feature Description

The Intelligence Wallet feature introduces quiz cards that surface data-driven insights to help users understand their spending patterns and make informed financial decisions. The system uses LLM-powered analysis via Supabase Edge Functions to generate personalized, contextual quizzes based on user's financial behavior.

## Technical Requirements

1. Create quiz card UI components
2. Implement Supabase Edge Functions for LLM integration
3. Add database tables for quiz sessions and analytics
4. Develop data analysis functions for spending insights
5. Create quiz generation and scoring logic
6. Implement caching and optimization strategies
7. Add required translations and accessibility features

## Architecture Overview

### Data Flow
1. **Data Collection**: Aggregate user's transactions, subscriptions, and spending patterns
2. **Analysis**: Process data through Supabase Edge Functions with LLM integration
3. **Quiz Generation**: Create personalized quiz content based on insights
4. **Presentation**: Display interactive quiz cards in the dashboard
5. **Learning**: Track user progress and adapt future quizzes

### Technology Stack
- **Frontend**: React components with existing UI library
- **Backend**: Supabase Edge Functions (Deno runtime)
- **LLM Integration**: OpenAI GPT-4 or similar via Edge Functions
- **Database**: PostgreSQL (Supabase)
- **Caching**: Redis-like caching through Supabase

## Implementation Steps

### Phase 1: Database Schema Setup

#### 1.1 Create Quiz Sessions Table

```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL, -- 'spending_awareness', 'subscription_management', 'budgeting', 'behavioral'
  quiz_data JSONB NOT NULL, -- Generated quiz content
  user_answers JSONB, -- User's responses
  score INTEGER, -- Quiz score (0-100)
  insights_shown JSONB, -- Insights presented to user
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_type ON quiz_sessions(quiz_type);
CREATE INDEX idx_quiz_sessions_created_at ON quiz_sessions(created_at);

-- Enable Row Level Security
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY select_quiz_sessions ON quiz_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_quiz_sessions ON quiz_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_quiz_sessions ON quiz_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

#### 1.2 Create User Quiz Analytics Table

```sql
CREATE TABLE user_quiz_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  total_quizzes INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  improvement_trend TEXT, -- 'improving', 'stable', 'declining'
  last_quiz_date TIMESTAMPTZ,
  insights_applied INTEGER DEFAULT 0, -- Number of insights user acted upon
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quiz_type)
);

-- Indexes
CREATE INDEX idx_user_quiz_analytics_user_id ON user_quiz_analytics(user_id);

-- Enable RLS
ALTER TABLE user_quiz_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY select_user_quiz_analytics ON user_quiz_analytics
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_user_quiz_analytics ON user_quiz_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_user_quiz_analytics ON user_quiz_analytics
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

#### 1.3 Create Financial Insights Cache Table

```sql
CREATE TABLE financial_insights_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'spending_pattern', 'subscription_optimization', 'budget_variance'
  insight_data JSONB NOT NULL,
  data_hash TEXT NOT NULL, -- Hash of source data for cache invalidation
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, insight_type, data_hash)
);

-- Indexes
CREATE INDEX idx_financial_insights_cache_user_id ON financial_insights_cache(user_id);
CREATE INDEX idx_financial_insights_cache_expires_at ON financial_insights_cache(expires_at);

-- Enable RLS
ALTER TABLE financial_insights_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY select_financial_insights_cache ON financial_insights_cache
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_financial_insights_cache ON financial_insights_cache
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_financial_insights_cache ON financial_insights_cache
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY delete_financial_insights_cache ON financial_insights_cache
  FOR DELETE USING (user_id = auth.uid());
```

### Phase 2: Supabase Edge Functions

#### 2.1 Create Financial Data Analysis Function

```typescript
// supabase/functions/analyze-financial-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FinancialAnalysisRequest {
  user_id: string;
  analysis_type: 'spending_patterns' | 'subscription_optimization' | 'budget_variance';
  time_period?: string; // '30d', '90d', '1y'
}

interface SpendingInsight {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage_change: number;
  recommendation: string;
}

serve(async (req) => {
  try {
    const { user_id, analysis_type, time_period = '30d' } = await req.json() as FinancialAnalysisRequest;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user's financial data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', new Date(Date.now() - getPeriodMs(time_period)).toISOString());

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id);

    // Analyze spending patterns
    const insights = await analyzeSpendingPatterns(transactions, subscriptions, analysis_type);
    
    return new Response(JSON.stringify({ insights }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function getPeriodMs(period: string): number {
  const periods = {
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['30d'];
}

async function analyzeSpendingPatterns(transactions: any[], subscriptions: any[], type: string) {
  // Implementation for spending pattern analysis
  // This would include statistical analysis, trend detection, etc.
  return {
    patterns: [],
    recommendations: [],
    risk_factors: []
  };
}
```

#### 2.2 Create Quiz Generation Function

```typescript
// supabase/functions/generate-quiz/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface QuizGenerationRequest {
  user_id: string;
  quiz_type: 'spending_awareness' | 'subscription_management' | 'budgeting' | 'behavioral';
  difficulty?: 'easy' | 'medium' | 'hard';
}

serve(async (req) => {
  try {
    const { user_id, quiz_type, difficulty = 'medium' } = await req.json() as QuizGenerationRequest;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's financial insights
    const insights = await getUserFinancialInsights(supabase, user_id);
    
    // Generate personalized quiz using LLM
    const quiz = await generatePersonalizedQuiz(insights, quiz_type, difficulty);
    
    // Store quiz session
    const { data: session } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id,
        quiz_type,
        quiz_data: quiz
      })
      .select()
      .single();

    return new Response(JSON.stringify({ quiz, session_id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function getUserFinancialInsights(supabase: any, user_id: string) {
  // Fetch cached insights or generate new ones
  const { data: cachedInsights } = await supabase
    .from('financial_insights_cache')
    .select('*')
    .eq('user_id', user_id)
    .gt('expires_at', new Date().toISOString());
    
  if (cachedInsights?.length > 0) {
    return cachedInsights.map(insight => insight.insight_data);
  }
  
  // Generate new insights if cache is empty or expired
  return await generateFreshInsights(supabase, user_id);
}

async function generatePersonalizedQuiz(insights: any[], quiz_type: string, difficulty: string) {
  // LLM integration for quiz generation
  const prompt = buildQuizPrompt(insights, quiz_type, difficulty);
  
  // Call OpenAI API or similar
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });
  
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

function buildQuizPrompt(insights: any[], quiz_type: string, difficulty: string): string {
  return `Generate a personalized financial literacy quiz based on the following user insights:
${JSON.stringify(insights, null, 2)}

Quiz Type: ${quiz_type}
Difficulty: ${difficulty}

Return a JSON object with the following structure:
{
  "title": "Quiz title",
  "description": "Brief description",
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "Why this answer is correct",
      "insight_connection": "How this relates to user's data"
    }
  ],
  "insights": [
    {
      "title": "Key insight",
      "description": "Detailed explanation",
      "action_items": ["Specific actions user can take"]
    }
  ]
}`;
}
```

### Phase 3: Frontend Components

#### 3.1 Create QuizCard Component

```typescript
// components/quiz/QuizCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    quiz_type: string;
    estimated_time: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  onStartQuiz: (quizId: string) => void;
  userProgress?: {
    completed: number;
    total: number;
    average_score: number;
  };
}

export function QuizCard({ quiz, onStartQuiz, userProgress }: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getQuizIcon = (type: string) => {
    switch (type) {
      case 'spending_awareness': return <TrendingUp className="h-5 w-5" />;
      case 'subscription_management': return <AlertCircle className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer ${
        isHovered ? 'shadow-lg scale-105' : 'shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getQuizIcon(quiz.quiz_type)}
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
          </div>
          <Badge className={getDifficultyColor(quiz.difficulty)}>
            {quiz.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-sm text-gray-600">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Estimated time: {quiz.estimated_time} min</span>
            {userProgress && (
              <span>Completed: {userProgress.completed}/{userProgress.total}</span>
            )}
          </div>
          
          {userProgress && userProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((userProgress.completed / userProgress.total) * 100)}%</span>
              </div>
              <Progress 
                value={(userProgress.completed / userProgress.total) * 100} 
                className="h-2"
              />
              {userProgress.average_score > 0 && (
                <div className="text-sm text-gray-600">
                  Average score: {userProgress.average_score}%
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => onStartQuiz(quiz.id)}
            className="w-full mt-4"
            variant={userProgress?.completed > 0 ? "outline" : "default"}
          >
            {userProgress?.completed > 0 ? 'Retake Quiz' : 'Start Quiz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.2 Create QuizInterface Component

```typescript
// components/quiz/QuizInterface.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  insight_connection: string;
}

interface QuizInterfaceProps {
  quiz: {
    title: string;
    description: string;
    questions: Question[];
    insights: Array<{
      title: string;
      description: string;
      action_items: string[];
    }>;
  };
  onComplete: (answers: number[], score: number) => void;
  onClose: () => void;
}

export function QuizInterface({ quiz, onComplete, onClose }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    
    if (!showExplanation) {
      setShowExplanation(true);
      return;
    }
    
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      const finalScore = calculateScore(newAnswers);
      setScore(finalScore);
      setQuizCompleted(true);
      onComplete(newAnswers, finalScore);
    }
  };

  const calculateScore = (userAnswers: number[]): number => {
    const correct = userAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correct_answer ? 1 : 0);
    }, 0);
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const currentQ = quiz.questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ.correct_answer;
  const progress = ((currentQuestion + (showExplanation ? 1 : 0)) / quiz.questions.length) * 100;

  if (quizCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          <div className="text-4xl font-bold text-blue-600 mt-4">
            {score}%
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            You scored {score}% on this financial literacy quiz.
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              Key Insights
            </h3>
            {quiz.insights.map((insight, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-medium mb-2">{insight.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Action Items:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {insight.action_items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Take Another Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{quiz.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        <Progress value={progress} className="mt-2" />
        <div className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>
          
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            disabled={showExplanation}
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className={`flex-1 p-3 rounded border cursor-pointer ${
                    showExplanation
                      ? index === currentQ.correct_answer
                        ? 'bg-green-50 border-green-200'
                        : selectedAnswer === index
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showExplanation && (
                      <div>
                        {index === currentQ.correct_answer && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {selectedAnswer === index && index !== currentQ.correct_answer && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {showExplanation && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                <p className="text-sm text-blue-800 mb-3">{currentQ.explanation}</p>
                <div className="text-sm text-blue-700">
                  <strong>Your Data Connection:</strong> {currentQ.insight_connection}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0 || showExplanation}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
          >
            {showExplanation 
              ? (currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question')
              : 'Submit Answer'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 4: Service Layer

#### 4.1 Create Quiz Service

```typescript
// lib/quizService.ts
import { supabase } from './supabaseClient';

export interface QuizSession {
  id: string;
  user_id: string;
  quiz_type: string;
  quiz_data: any;
  user_answers?: number[];
  score?: number;
  insights_shown?: any;
  completed_at?: string;
  created_at: string;
}

export interface UserQuizAnalytics {
  quiz_type: string;
  total_quizzes: number;
  average_score: number;
  improvement_trend: 'improving' | 'stable' | 'declining';
  last_quiz_date?: string;
  insights_applied: number;
}

class QuizService {
  async generateQuiz(quiz_type: string, difficulty: string = 'medium') {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        quiz_type,
        difficulty
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  async submitQuizAnswers(session_id: string, answers: number[], score: number) {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .update({
        user_answers: answers,
        score,
        completed_at: new Date().toISOString()
      })
      .eq('id', session_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update user analytics
    await this.updateUserAnalytics(data.quiz_type, score);
    
    return data;
  }
  
  async getUserQuizHistory(quiz_type?: string) {
    let query = supabase
      .from('quiz_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (quiz_type) {
      query = query.eq('quiz_type', quiz_type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as QuizSession[];
  }
  
  async getUserAnalytics(): Promise<UserQuizAnalytics[]> {
    const { data, error } = await supabase
      .from('user_quiz_analytics')
      .select('*');
    
    if (error) throw error;
    return data as UserQuizAnalytics[];
  }
  
  private async updateUserAnalytics(quiz_type: string, score: number) {
    const user_id = (await supabase.auth.getUser()).data.user?.id;
    if (!user_id) return;
    
    // Get existing analytics
    const { data: existing } = await supabase
      .from('user_quiz_analytics')
      .select('*')
      .eq('quiz_type', quiz_type)
      .single();
    
    if (existing) {
      // Update existing record
      const new_total = existing.total_quizzes + 1;
      const new_average = ((existing.average_score * existing.total_quizzes) + score) / new_total;
      
      await supabase
        .from('user_quiz_analytics')
        .update({
          total_quizzes: new_total,
          average_score: new_average,
          last_quiz_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('user_quiz_analytics')
        .insert({
          user_id,
          quiz_type,
          total_quizzes: 1,
          average_score: score,
          last_quiz_date: new Date().toISOString()
        });
    }
  }
  
  async getFinancialInsights() {
    const { data, error } = await supabase.functions.invoke('analyze-financial-data', {
      body: {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        analysis_type: 'spending_patterns',
        time_period: '30d'
      }
    });
    
    if (error) throw error;
    return data.insights;
  }
}

export const quizService = new QuizService();
```

### Phase 5: Integration with Dashboard

#### 5.1 Update Dashboard View

```typescript
// Add to components/dashboard/DashboardView.tsx
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizInterface } from '@/components/quiz/QuizInterface';
import { quizService } from '@/lib/quizService';

// Add to DashboardView component:
const [availableQuizzes, setAvailableQuizzes] = useState([]);
const [currentQuiz, setCurrentQuiz] = useState(null);
const [showQuizInterface, setShowQuizInterface] = useState(false);
const [userAnalytics, setUserAnalytics] = useState([]);

useEffect(() => {
  loadQuizData();
}, []);

const loadQuizData = async () => {
  try {
    const analytics = await quizService.getUserAnalytics();
    setUserAnalytics(analytics);
    
    // Generate available quiz types based on user data
    const quizTypes = [
      {
        id: 'spending_awareness',
        title: 'Spending Awareness Challenge',
        description: 'Test your knowledge about your spending patterns',
        quiz_type: 'spending_awareness',
        estimated_time: 5,
        difficulty: 'medium' as const
      },
      {
        id: 'subscription_management',
        title: 'Subscription Optimization Quiz',
        description: 'Learn how to manage your recurring subscriptions',
        quiz_type: 'subscription_management',
        estimated_time: 7,
        difficulty: 'easy' as const
      }
    ];
    
    setAvailableQuizzes(quizTypes);
  } catch (error) {
    console.error('Failed to load quiz data:', error);
  }
};

const handleStartQuiz = async (quizId: string) => {
  try {
    const quiz = availableQuizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const generatedQuiz = await quizService.generateQuiz(quiz.quiz_type, quiz.difficulty);
    setCurrentQuiz(generatedQuiz);
    setShowQuizInterface(true);
  } catch (error) {
    console.error('Failed to start quiz:', error);
  }
};

const handleQuizComplete = async (answers: number[], score: number) => {
  try {
    await quizService.submitQuizAnswers(currentQuiz.session_id, answers, score);
    await loadQuizData(); // Refresh analytics
  } catch (error) {
    console.error('Failed to submit quiz:', error);
  }
};

// Add to JSX:
{showQuizInterface && currentQuiz ? (
  <QuizInterface
    quiz={currentQuiz.quiz}
    onComplete={handleQuizComplete}
    onClose={() => setShowQuizInterface(false)}
  />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <h2 className="col-span-full text-xl font-semibold mb-4">Financial Intelligence Quizzes</h2>
    {availableQuizzes.map((quiz) => {
      const analytics = userAnalytics.find(a => a.quiz_type === quiz.quiz_type);
      return (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          onStartQuiz={handleStartQuiz}
          userProgress={analytics ? {
            completed: analytics.total_quizzes,
            total: 10, // Arbitrary total for progress calculation
            average_score: analytics.average_score
          } : undefined}
        />
      );
    })}
  </div>
)}
```

### Phase 6: Translations and Accessibility

#### 6.1 Add Translations

```json
// messages/en.json - Add quiz-related translations
{
  "quiz": {
    "title": "Financial Intelligence",
    "subtitle": "Learn from your spending patterns",
    "start_quiz": "Start Quiz",
    "retake_quiz": "Retake Quiz",
    "quiz_completed": "Quiz Completed!",
    "your_score": "Your Score",
    "key_insights": "Key Insights",
    "action_items": "Action Items",
    "estimated_time": "Estimated time",
    "minutes": "min",
    "progress": "Progress",
    "average_score": "Average score",
    "question_of": "Question {current} of {total}",
    "submit_answer": "Submit Answer",
    "next_question": "Next Question",
    "finish_quiz": "Finish Quiz",
    "explanation": "Explanation",
    "your_data_connection": "Your Data Connection",
    "difficulty": {
      "easy": "Easy",
      "medium": "Medium",
      "hard": "Hard"
    },
    "types": {
      "spending_awareness": {
        "title": "Spending Awareness Challenge",
        "description": "Test your knowledge about your spending patterns"
      },
      "subscription_management": {
        "title": "Subscription Optimization Quiz",
        "description": "Learn how to manage your recurring subscriptions"
      },
      "budgeting": {
        "title": "Budgeting Mastery",
        "description": "Improve your budgeting skills and financial planning"
      },
      "behavioral": {
        "title": "Behavioral Finance Quiz",
        "description": "Understand the psychology behind your financial decisions"
      }
    }
  }
}
```

```json
// messages/id.json - Indonesian translations
{
  "quiz": {
    "title": "Kecerdasan Finansial",
    "subtitle": "Belajar dari pola pengeluaran Anda",
    "start_quiz": "Mulai Kuis",
    "retake_quiz": "Ulangi Kuis",
    "quiz_completed": "Kuis Selesai!",
    "your_score": "Skor Anda",
    "key_insights": "Wawasan Utama",
    "action_items": "Item Tindakan",
    "estimated_time": "Perkiraan waktu",
    "minutes": "menit",
    "progress": "Kemajuan",
    "average_score": "Skor rata-rata",
    "question_of": "Pertanyaan {current} dari {total}",
    "submit_answer": "Kirim Jawaban",
    "next_question": "Pertanyaan Selanjutnya",
    "finish_quiz": "Selesaikan Kuis",
    "explanation": "Penjelasan",
    "your_data_connection": "Koneksi Data Anda",
    "difficulty": {
      "easy": "Mudah",
      "medium": "Sedang",
      "hard": "Sulit"
    },
    "types": {
      "spending_awareness": {
        "title": "Tantangan Kesadaran Pengeluaran",
        "description": "Uji pengetahuan Anda tentang pola pengeluaran"
      },
      "subscription_management": {
        "title": "Kuis Optimasi Langganan",
        "description": "Pelajari cara mengelola langganan berulang"
      },
      "budgeting": {
        "title": "Penguasaan Anggaran",
        "description": "Tingkatkan keterampilan anggaran dan perencanaan keuangan"
      },
      "behavioral": {
        "title": "Kuis Keuangan Perilaku",
        "description": "Pahami psikologi di balik keputusan keuangan Anda"
      }
    }
  }
}
```

## Cost Optimization Strategies

### 1. Caching Strategy
- Cache financial insights for 24 hours
- Cache quiz content for 1 hour
- Use Supabase's built-in caching mechanisms
- Implement client-side caching for repeated quiz attempts

### 2. LLM Usage Optimization
- Batch multiple users' data for analysis
- Use smaller models for simple quiz generation
- Implement fallback to pre-generated quiz templates
- Rate limiting to prevent excessive API calls

### 3. Database Optimization
- Use database functions for complex calculations
- Implement proper indexing for quiz queries
- Archive old quiz sessions after 6 months
- Use JSONB efficiently for flexible data storage

## Security Considerations

### 1. Data Privacy
- All financial data remains in Supabase
- LLM receives only aggregated, anonymized insights
- User consent for data analysis
- GDPR compliance for data retention

### 2. API Security
- Rate limiting on Edge Functions
- Input validation and sanitization
- Secure API key management
- Row Level Security (RLS) on all tables

### 3. Content Safety
- Validate LLM-generated content
- Implement content filtering
- Fallback to curated content if needed
- Monitor for inappropriate responses

## Testing Strategy

### 1. Unit Tests
- Quiz generation logic
- Scoring algorithms
- Data analysis functions
- Component rendering

### 2. Integration Tests
- Edge Function workflows
- Database operations
- LLM integration
- User journey flows

### 3. Performance Tests
- Quiz loading times
- Database query performance
- Edge Function response times
- Concurrent user handling

## Deployment Plan

### Phase 1: Core Infrastructure (Week 1-2)
- Database schema setup
- Basic Edge Functions
- Core UI components

### Phase 2: Quiz Generation (Week 3-4)
- LLM integration
- Quiz interface
- Basic analytics

### Phase 3: Advanced Features (Week 5-6)
- Personalization improvements
- Advanced analytics
- Performance optimization

### Phase 4: Polish & Launch (Week 7-8)
- UI/UX refinements
- Testing and bug fixes
- Documentation and training

## Success Metrics

### 1. Engagement Metrics
- Quiz completion rate (target: >70%)
- Average session duration
- Return user rate for quizzes
- User progression through difficulty levels

### 2. Educational Impact
- Score improvement over time
- Knowledge retention (follow-up quizzes)
- Behavioral changes in spending patterns
- User feedback and satisfaction

### 3. Technical Metrics
- System performance and reliability
- Cost per quiz generated
- API response times
- Error rates and system uptime

## Future Enhancements

### 1. Advanced Personalization
- Machine learning for quiz difficulty adjustment
- Adaptive learning paths
- Personalized financial goals integration
- Social features and leaderboards

### 2. Extended Content
- Video explanations for complex topics
- Interactive simulations
- Real-world case studies
- Expert-curated content

### 3. Integration Opportunities
- Bank account integration for real-time insights
- Investment portfolio analysis
- Credit score improvement tracking
- Financial advisor recommendations

## Conclusion

The Intelligence Wallet feature represents a significant enhancement to the Veeda Wallet application, providing users with personalized financial education through data-driven quiz cards. By leveraging existing transaction and subscription data, the system can offer relevant, actionable insights that help users make better financial decisions.

The implementation plan prioritizes user privacy, system performance, and cost efficiency while delivering a engaging and educational experience. The modular architecture allows for iterative development and future enhancements based on user feedback and usage patterns.

This feature positions Veeda Wallet as not just a spending tracker, but as a comprehensive financial intelligence platform that actively helps users improve their financial literacy and decision-making skills.