'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Cpu,
  Database,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface AiMetrics {
  totalEmbeddings: number;
  totalLogs: number;
  totalTokensUsed: number;
}

export default function AdminAiPage() {
  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAiMetrics() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [articlesRes, logsRes] = await Promise.all([
        supabase.from('ai_knowledge_articles').select('*', { count: 'exact', head: true }),
        supabase.from('ai_usage_logs').select('total_tokens'),
      ]);

      const totalTokens = (logsRes.data ?? []).reduce(
        (sum, row) => sum + (row.total_tokens || 0),
        0,
      );

      setMetrics({
        totalEmbeddings: articlesRes.count ?? 0,
        totalLogs: logsRes.data?.length ?? 0,
        totalTokensUsed: totalTokens,
      });
    } catch (err) {
      console.error('[AdminAi] Error fetching AI metrics:', err);
      toast.error('تعذر تحميل إحصائيات الذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAiMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            مراقبة الذكاء الاصطناعي والمصادر (AI Operations)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            متابعة استهلاك الرموز (Tokens)، الردود التلقائية للذكاء الاصطناعي، ومصادر المعرفة المتجهة
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAiMetrics}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث الإحصائيات
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">جاري فحص مؤشرات الذكاء الاصطناعي...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">استهلاك الرموز (Total Tokens)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Cpu className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-foreground">
              {metrics?.totalTokensUsed.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">مجموع الـ Tokens المستهلكة عبر OpenAI & Anthropic</p>
          </Card>

          <Card className="border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">الردود التلقائية المنجزة</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Bot className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-foreground">
              {metrics?.totalLogs.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">محادثة تمت الإجابة عليها تلقائياً بواسطة AI</p>
          </Card>

          <Card className="border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">مقالات قاعدة المعرفة (Vector Articles)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Database className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-foreground">
              {metrics?.totalEmbeddings.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">مستند ومقال معرفي مخزن في Vector Database</p>
          </Card>
        </div>
      )}
    </div>
  );
}
