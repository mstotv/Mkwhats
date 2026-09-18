import Link from 'next/link';
import { ShieldAlert, LifeBuoy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'الخدمة متوقفة مؤقتاً — Service Suspended',
  robots: { index: false, follow: false },
};

export default function ResellerSuspendedPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl font-black text-foreground">المنصة متوقفة مؤقتاً</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            تم تعليق الوصول إلى هذه المنصة مؤقتاً من قِبل إدارة النظام لانتهاء فترة الاشتراك أو قيد المراجعة الدورية.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground">هل أنت مالك هذه المنصة؟</p>
          <p>
            يرجى التواصل مع مزود الخدمة الرئيسي لتجديد وتنشيط اشتراكك واستعادة تشغيل خدماتك فوراً.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link href="/">
            <Button variant="outline" className="rounded-xl text-xs h-9">
              <ArrowLeft className="h-4 w-4 me-1.5" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
