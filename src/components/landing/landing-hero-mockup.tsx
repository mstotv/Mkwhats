'use client'

import { useState } from 'react'
import { Bot, Send, Radio, ShoppingBag, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react'
import { useLocale } from 'next-intl'

type TabType = 'ai' | 'broadcast' | 'orders'

export function LandingHeroMockup() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [activeTab, setActiveTab] = useState<TabType>('ai')

  return (
    <div className="space-y-4">
      {/* Interactive Tabs Header */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all duration-200 ${
            activeTab === 'ai'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
          }`}
        >
          <Bot className="h-4 w-4" /> 🤖 {isAr ? 'مساعد الذكاء الاصطناعي (Gemini AI)' : 'Gemini AI Assistant'}
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all duration-200 ${
            activeTab === 'broadcast'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
          }`}
        >
          <Radio className="h-4 w-4" /> 📢 {isAr ? 'إرسال برودكاست جماعي' : 'Targeted Bulk Broadcast'}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all duration-200 ${
            activeTab === 'orders'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
          }`}
        >
          <ShoppingBag className="h-4 w-4" /> 🛒 {isAr ? 'جمع الطلبات والتصدير لـ Excel' : 'Order Sync & Excel Export'}
        </button>
      </div>

      {/* Mac Browser Frame */}
      <div className="rounded-3xl border border-border bg-card/90 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300">
        {/* Window Bar Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4 px-2 dir-ltr">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
          </div>
          <div className="rounded-xl bg-background border border-border px-5 py-1 text-[11px] font-mono text-muted-foreground w-1/2 text-center flex items-center justify-center gap-2 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            app.mkwhats.com/dashboard
          </div>
          <div className="text-[11px] text-emerald-500 font-mono font-black">● Live Active</div>
        </div>

        {/* Dynamic Content Based on Active Tab */}
        {activeTab === 'ai' && (
          <div className="rounded-2xl border border-border bg-background p-4 sm:p-6 flex flex-col lg:flex-row items-stretch gap-6 transition-all">
            {/* Conversations Sidebar */}
            <div className="w-full lg:w-1/3 bg-card border border-border rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">
                  {isAr ? 'المحادثات النشطة' : 'Active Chats'}
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {isAr ? '32 متصل الآن' : '32 Online'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-muted/80 border border-emerald-500/50 p-3 rounded-xl flex items-center gap-3 shadow-md">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 font-bold flex items-center justify-center text-xs">
                    {isAr ? 'أ' : 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                      <span>{isAr ? 'أحمد العتيبي' : 'Ahmed Otaibi'}</span>
                      <span className="text-[10px] text-muted-foreground">10:42 AM</span>
                    </div>
                    <p className="text-[11px] text-emerald-500 font-medium truncate">
                      {isAr ? 'تم تأكيد الطلب #8920 بنجاح ✅' : 'Order #8920 Confirmed ✅'}
                    </p>
                  </div>
                </div>

                <div className="bg-card/60 border border-border/60 p-3 rounded-xl flex items-center gap-3 opacity-80">
                  <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-xs">
                    {isAr ? 'س' : 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                      <span>{isAr ? 'سارة الشمري' : 'Sarah Al-Shammari'}</span>
                      <span className="text-[10px] text-muted-foreground">10:38 AM</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isAr ? 'كم سعر الخطة الاحترافية؟' : 'What is the price of Pro Plan?'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 bg-card/60 border border-border rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? 'أحمد العتيبي (+966 50...)' : 'Ahmed Otaibi (+966 50...)'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {isAr ? 'رد آلي بـ Gemini AI' : 'Gemini AI Auto-Reply'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-muted text-foreground text-xs p-3.5 rounded-2xl max-w-[85%] border border-border shadow-sm">
                  {isAr ? 'مرحباً، هل متوفر شحن سريع للرياض وكم يستغرق؟' : 'Hi! Is express shipping available to Riyadh and how long does it take?'}
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs p-4 rounded-2xl max-w-[85%] ms-auto shadow-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black">
                    <Bot className="h-4 w-4" /> {isAr ? 'مساعد MK Whats الذكي' : 'MK Whats AI Assistant'}
                  </div>
                  <p className="leading-relaxed font-medium">
                    {isAr
                      ? 'أهلاً بك يا أحمد! نعم متوفر الشحن السريع للرياض خلال 24 ساعة فقط 🚚. هل ترغب في تسجيل طلبك الآن وإرسال رابط الدفع؟'
                      : 'Hello Ahmed! Yes, express shipping to Riyadh is available within 24 hours 🚚. Would you like to confirm your order now and receive the payment link?'}
                  </p>
                </div>
              </div>

              {/* Input Box Simulation */}
              <div className="pt-2 border-t border-border flex items-center gap-2">
                <div className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-muted-foreground">
                  {isAr ? 'اكتب رسالة أو اختر رداً سريعاً...' : 'Type a message or select a quick reply...'}
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Send className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="rounded-2xl border border-border bg-background p-6 space-y-6 transition-all">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" /> {isAr ? 'حملة العروض الصيفية الكبرى' : 'Mega Summer Sale Campaign'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? 'موجّهة إلى 2,500 عميل مستهدف' : 'Targeted to 2,500 customers'}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                {isAr ? 'جاري الإرسال (94%)' : 'Sending in Progress (94%)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground">{isAr ? 'الرسائل المرسلة' : 'Messages Sent'}</span>
                <div className="text-xl font-extrabold text-foreground">2,350 / 2,500</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground">{isAr ? 'نسبة التسليم الأكيد' : 'Delivery Rate'}</span>
                <div className="text-xl font-extrabold text-emerald-500">99.8%</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground">{isAr ? 'معدل التفاعل والقراءة' : 'Read & Open Rate'}</span>
                <div className="text-xl font-extrabold text-indigo-400">84.2%</div>
              </div>
            </div>

            <div className="w-full bg-card h-3 rounded-full overflow-hidden border border-border p-0.5">
              <div className="bg-emerald-500 h-full rounded-full w-[94%] transition-all duration-500" />
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="rounded-2xl border border-border bg-background p-6 space-y-6 transition-all">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-500" /> {isAr ? 'سجل الطلبات وتصدير البيانات' : 'Order Sync & Data Export'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? 'مزامنة تلقائية 100% مع Google Sheets و Excel' : '100% Automatic sync with Google Sheets & Excel'}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? 'تم التصدير بنجاح' : 'Export Complete'}
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden text-xs">
              <table className="w-full text-start">
                <thead className="bg-card text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                    <th className="p-3 text-start">{isAr ? 'اسم العميل' : 'Customer Name'}</th>
                    <th className="p-3 text-start">{isAr ? 'المدينة' : 'City'}</th>
                    <th className="p-3 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium text-foreground">
                  <tr>
                    <td className="p-3 font-mono">#8920</td>
                    <td className="p-3">{isAr ? 'أحمد العتيبي' : 'Ahmed Otaibi'}</td>
                    <td className="p-3">{isAr ? 'الرياض' : 'Riyadh'}</td>
                    <td className="p-3 font-bold text-emerald-500">$240</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {isAr ? 'مؤكد ومرفق إكسل' : 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono">#8921</td>
                    <td className="p-3">{isAr ? 'سارة الشمري' : 'Sarah Al-Shammari'}</td>
                    <td className="p-3">{isAr ? 'جدة' : 'Jeddah'}</td>
                    <td className="p-3 font-bold text-emerald-500">$450</td>
                    <td className="p-3">
                      <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {isAr ? 'قيد المعالجة' : 'Processing'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
