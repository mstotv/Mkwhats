'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Headphones,
  MessageCircle,
  Send,
  Mail,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Plus,
  Paperclip,
  Image as ImageIcon,
  X,
  RefreshCw,
  MessageSquare,
  Check,
  RotateCcw,
  User,
  Shield,
  Search,
  Building,
  AlertTriangle,
  ChevronRight,
  Filter,
  Megaphone,
  BarChart3,
  Eye,
  Users,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

interface AdminTicket {
  id: string
  account_id: string
  user_id: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'resolved' | 'closed'
  last_reply_at: string
  created_at: string
  user_name: string
  user_email: string
  account_name: string
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: 'user' | 'admin'
  sender_id: string
  message_text: string
  attachments?: { url: string; name?: string; type?: string }[]
  created_at: string
}

interface BroadcastCampaign {
  id: string
  title: string
  message_text: string
  category: string
  priority: string
  attachments: { url: string; name?: string }[]
  total_delivered: number
  total_opened: number
  open_rate: number
  created_at: string
}

interface RecipientReport {
  ticket_id: string
  account_name: string
  user_name: string
  user_email: string
  is_read: boolean
  read_status: string
  delivered_at: string
}

export function AdminTicketsClient() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  // Top Section Tab: 'tickets' or 'broadcasts'
  const [activeTab, setActiveTab] = useState<'tickets' | 'broadcasts'>('tickets')

  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Ticket Drawer / Modal
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Broadcasts Dashboard State
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)

  // Campaign Detailed Report Modal State
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null)
  const [recipientsReport, setRecipientsReport] = useState<RecipientReport[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMessageText, setBroadcastMessageText] = useState('')
  const [broadcastCategory, setBroadcastCategory] = useState<'announcement' | 'offer' | 'update' | 'general'>('announcement')
  const [broadcastPriority, setBroadcastPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high')
  const [broadcastAttachments, setBroadcastAttachments] = useState<{ url: string; name: string }[]>([])
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [uploadingBroadcastImage, setUploadingBroadcastImage] = useState(false)
  const broadcastFileInputRef = useRef<HTMLInputElement>(null)

  // Reply State
  const [replyText, setReplyText] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<{ url: string; name: string }[]>([])
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const replyFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeTicketIdRef = useRef<string | null>(null)

  // Fetch Tickets
  async function fetchTickets() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/tickets')
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch (err) {
      console.error('Failed to fetch admin tickets:', err)
      toast.error(isAr ? 'فشل جلب تذاكر الدعم' : 'Failed to fetch support tickets')
    } finally {
      setLoading(false)
    }
  }

  // Fetch Broadcast Campaigns
  async function fetchBroadcasts() {
    try {
      setCampaignsLoading(true)
      const res = await fetch('/api/admin/broadcasts')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err)
    } finally {
      setCampaignsLoading(false)
    }
  }

  // Fetch Campaign Report details
  async function handleOpenCampaignReport(campaign: BroadcastCampaign) {
    setSelectedCampaign(campaign)
    setIsReportOpen(true)
    setReportLoading(true)
    try {
      const res = await fetch(`/api/admin/broadcasts/${campaign.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCampaign(data.campaign)
        setRecipientsReport(data.recipients || [])
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل تقرير الحسابات' : 'Failed to load report')
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchBroadcasts()
  }, [])

  // Auto scroll chat
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Open & Close Ticket Handlers
  async function handleOpenTicket(ticket: AdminTicket) {
    activeTicketIdRef.current = ticket.id
    setSelectedTicket(ticket)
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`)
      if (res.ok && activeTicketIdRef.current === ticket.id) {
        const data = await res.json()
        setSelectedTicket(data.ticket)
        setMessages(data.messages || [])
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل الرسائل' : 'Failed to load conversation')
    } finally {
      if (activeTicketIdRef.current === ticket.id) {
        setMessagesLoading(false)
      }
    }
  }

  function handleCloseTicket() {
    activeTicketIdRef.current = null
    setSelectedTicket(null)
  }

  // Silent refresh for Admin live polling (no spinner flicker)
  async function refreshAdminTicketChatSilently(ticketId: string) {
    if (activeTicketIdRef.current !== ticketId) return
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`)
      if (res.ok && activeTicketIdRef.current === ticketId) {
        const data = await res.json()
        if (activeTicketIdRef.current === ticketId) {
          setSelectedTicket(data.ticket)
          setMessages(data.messages || [])
        }
      }
    } catch {
      // Ignore silent refresh errors
    }
  }

  // Realtime & Live Polling Effect for Admin Ticket Chat
  useEffect(() => {
    if (!selectedTicket?.id) return
    const ticketId = selectedTicket.id
    const supabase = createClient()

    // 1. Live 3-second polling interval
    const interval = setInterval(() => {
      refreshAdminTicketChatSilently(ticketId)
    }, 3000)

    // 2. Supabase Realtime channel subscription
    const channel = supabase
      .channel(`support_ticket_admin:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          refreshAdminTicketChatSilently(ticketId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`,
        },
        () => {
          refreshAdminTicketChatSilently(ticketId)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [selectedTicket?.id])

  // Handle Admin Image Upload
  async function handleAdminFileUpload(file: File) {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/support/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل رفع الصورة' : 'Image upload failed'))
        return
      }

      setReplyAttachments((prev) => [...prev, { url: data.url, name: data.fileName || file.name }])
      toast.success(isAr ? 'تم إرفاق الصورة بنجاح' : 'Image uploaded successfully')
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء رفع الصورة' : 'Upload error')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Broadcast Image Upload (Banners/Offers)
  async function handleBroadcastFileUpload(file: File) {
    try {
      setUploadingBroadcastImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/support/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل رفع صورة العرض/الإشعار' : 'Banner upload failed'))
        return
      }

      setBroadcastAttachments((prev) => [...prev, { url: data.url, name: data.fileName || file.name }])
      toast.success(isAr ? 'تم إرفاق صورة العرض بنجاح' : 'Banner uploaded')
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء رفع الصورة' : 'Upload error')
    } finally {
      setUploadingBroadcastImage(false)
    }
  }

  // Handle Send Broadcast Notification to All Users
  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!broadcastSubject.trim() || (!broadcastMessageText.trim() && broadcastAttachments.length === 0)) {
      toast.error(isAr ? 'يرجى كتابة عنوان الإشعار وتفاصيل الرسالة' : 'Please provide subject and message content')
      return
    }

    try {
      setSendingBroadcast(true)
      const res = await fetch('/api/admin/tickets/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject.trim(),
          message_text: broadcastMessageText.trim(),
          category: broadcastCategory,
          priority: broadcastPriority,
          attachments: broadcastAttachments,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast')

      toast.success(isAr ? `تم إرسال الإشعار/العرض الشامل بنجاح إلى ${data.delivered_count} حساب! 🚀` : `Broadcast delivered to ${data.delivered_count} accounts!`)
      setIsBroadcastOpen(false)
      setBroadcastSubject('')
      setBroadcastMessageText('')
      setBroadcastAttachments([])
      fetchTickets()
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'فشل إرسال الإشعار الشامل' : 'Failed to send broadcast'))
    } finally {
      setSendingBroadcast(false)
    }
  }

  // Send Admin Reply
  async function handleSendAdminReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket) return
    if (!replyText.trim() && replyAttachments.length === 0) return

    try {
      setSendingReply(true)
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: replyText,
          attachments: replyAttachments,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل إرسال الرد' : 'Failed to send reply'))
        return
      }

      setMessages((prev) => [...prev, data.message])
      setReplyText('')
      setReplyAttachments([])
      toast.success(isAr ? 'تم إرسال الرد للعميل بنجاح 🚀' : 'Reply sent to user successfully 🚀')
      fetchTickets()
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'))
    } finally {
      setSendingReply(false)
    }
  }

  // Update Status (Resolve / Close / Reopen)
  async function handleUpdateAdminStatus(newStatus: 'open' | 'resolved' | 'closed') {
    if (!selectedTicket) return
    try {
      setUpdatingStatus(true)
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل تحديث الحالة' : 'Failed to update status'))
        return
      }

      setSelectedTicket(data.ticket)
      toast.success(
        newStatus === 'resolved'
          ? (isAr ? 'تم تحديد التذكرة كمحلولة المشكلة! ✅' : 'Ticket marked as resolved! ✅')
          : newStatus === 'closed'
          ? (isAr ? 'تم إغلاق التذكرة! 🛑' : 'Ticket closed! 🛑')
          : (isAr ? 'تم إعادة فتح التذكرة! 🔄' : 'Ticket reopened! 🔄')
      )
      fetchTickets()
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'خطأ في تحديث الحالة' : 'Status update error'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Exclude broadcast announcements from Customer Tickets list
  const customerTicketsOnly = tickets.filter((t: any) => {
    const isBroadcast = Boolean(t.is_announcement || t.category === 'announcement' || t.category === 'offer' || t.category === 'update')
    return !isBroadcast
  })

  // Filter Logic
  const filteredTickets = customerTicketsOnly.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Stats Counters (for Customer Support Tickets only)
  const totalCount = customerTicketsOnly.length
  const openCount = customerTicketsOnly.filter((t) => t.status === 'open').length
  const resolvedCount = customerTicketsOnly.filter((t) => t.status === 'resolved').length
  const closedCount = customerTicketsOnly.filter((t) => t.status === 'closed').length

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {isAr ? 'إدارة التذاكر والإشعارات الشاملة' : 'Support & Broadcasts Manager'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'متابعة تذاكر العملاء، إرسال إشعارات وعروض لجميع المستخدمين، وتتبع نسب القراءة والفتح' : 'Manage customer tickets, send platform broadcast offers, and track read metrics'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsBroadcastOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            <Megaphone className="h-4 w-4" />
            {isAr ? 'إرسال إشعار / عرض لجميع الحسابات 📢' : 'Broadcast to All Accounts 📢'}
          </Button>

          <Button
            onClick={() => {
              fetchTickets()
              fetchBroadcasts()
            }}
            disabled={loading || campaignsLoading}
            variant="outline"
            className="text-xs gap-2 font-bold shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(loading || campaignsLoading) ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Top Navigation Tabs: Customer Tickets vs Broadcast Analytics Dashboard */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'tickets'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Headphones className="h-4 w-4" />
          {isAr ? 'تذاكر دعم العملاء' : 'Customer Tickets'}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/30 text-current font-mono">
            {customerTicketsOnly.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('broadcasts')
            fetchBroadcasts()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'broadcasts'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {isAr ? 'داشبورد إشعارات وعروض المنصة 📊' : 'Broadcasts Dashboard 📊'}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/30 text-current font-mono">
            {campaigns.length}
          </Badge>
        </button>
      </div>

      {activeTab === 'broadcasts' ? (
        /* Broadcast Analytics Dashboard Tab */
        <div className="space-y-6">
          {/* Broadcast Stat Cards */}
          {/* Broadcast Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-muted-foreground">{isAr ? 'حملات الإشعارات المرسلة' : 'Sent Campaigns'}</span>
                <Megaphone className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-foreground mt-2">{campaigns.length}</p>
            </Card>

            <Card className="p-5 border-indigo-500/30 bg-indigo-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-400">{isAr ? 'إجمالي الحسابات المستلمة' : 'Total Delivered'}</span>
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-indigo-400 mt-2">
                {campaigns.reduce((acc, c) => acc + (c.total_delivered || 0), 0)}
              </p>
            </Card>
          </div>

          {/* Campaigns List */}
          <Card className="border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-400" />
                {isAr ? 'قائمة إشعارات وعروض المنصة المرسلة' : 'Platform Broadcast Campaigns'}
              </h3>
              <Button
                size="sm"
                onClick={() => setIsBroadcastOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إشعار جديد' : 'New Broadcast'}
              </Button>
            </div>

            {campaignsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-2xl bg-muted/20">
                <Megaphone className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs text-muted-foreground font-bold">
                  {isAr ? 'لم تقم بإرسال أي إشعار أو عرض شامل حتى الآن' : 'No broadcast campaigns sent yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-border bg-background hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-foreground">{c.title}</span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {c.category === 'offer' ? (isAr ? 'عرض خاص 🎁' : 'Offer 🎁') : c.category === 'update' ? (isAr ? 'تحديث 🚀' : 'Update 🚀') : (isAr ? 'إعلان 📢' : 'Announcement 📢')}
                        </Badge>
                        {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                          <Badge className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                            {isAr ? 'يتضمن مرفق/صورة 🖼️' : 'Includes Attachment 🖼️'}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1">{c.message_text}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {isAr ? `تاريخ الإرسال: ${new Date(c.created_at).toLocaleString()}` : `Sent: ${new Date(c.created_at).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <Badge variant="secondary" className="px-3 py-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold">
                        {isAr ? `تم التسليم إلى ${c.total_delivered || 0} حساب` : `Delivered to ${c.total_delivered || 0} accounts`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Customer Support Tickets Tab */
        <>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">{isAr ? 'إجمالي التذاكر' : 'Total Tickets'}</span>
            <MessageSquare className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{totalCount}</p>
        </Card>

        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500">{isAr ? 'مفتوحة وقيد الانتظار' : 'Open / Pending'}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{openCount}</p>
        </Card>

        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500">{isAr ? 'تم حلها بنجاح' : 'Resolved'}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{resolvedCount}</p>
        </Card>

        <Card className="p-4 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500">{isAr ? 'مغلقة' : 'Closed'}</span>
            <X className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{closedCount}</p>
        </Card>
      </div>

      {/* Main Content Table & Filters */}
      <Card className="border border-border bg-card p-6 space-y-6">
        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-3.5 w-3.5 absolute start-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isAr ? 'بحث باسم الحساب، العميل، أو الموضوع...' : 'Search by account, client, or subject...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-background text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
            {(['all', 'open', 'resolved', 'closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex-1 sm:flex-none ${
                  statusFilter === st
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'all'
                  ? (isAr ? 'جميع التذاكر' : 'All')
                  : st === 'open'
                  ? (isAr ? 'مفتوحة 🟡' : 'Open 🟡')
                  : st === 'resolved'
                  ? (isAr ? 'تم حلها 🟢' : 'Resolved 🟢')
                  : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-2xl bg-muted/20">
            <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-xs text-muted-foreground font-bold">
              {isAr ? 'لا توجد تذاكر دعم فني في هذا الفلتر حالياً' : 'No tickets match the selected filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenTicket(t)}
                className="p-4 rounded-2xl border border-border bg-background hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-foreground group-hover:text-emerald-400 transition-colors">
                      {t.subject}
                    </span>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        t.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : t.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {t.status === 'open'
                        ? (isAr ? 'قيد المتابعة 🟡' : 'Open 🟡')
                        : t.status === 'resolved'
                        ? (isAr ? 'تم حل المشكلة 🟢' : 'Resolved 🟢')
                        : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
                    </Badge>

                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      {t.priority} priority
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      {t.user_name} ({t.user_email})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.account_name}
                    </span>
                    <span>•</span>
                    <span>{isAr ? `تاريخ الإنشاء: ${new Date(t.created_at).toLocaleDateString()}` : `Created: ${new Date(t.created_at).toLocaleDateString()}`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 text-emerald-400">
                    {isAr ? 'فتح وتواصل' : 'Open & Reply'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      </>
      )}

      {/* Admin Chat Drawer Modal */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => { if (!open) handleCloseTicket(); }}>
          <DialogContent className="sm:max-w-4xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg text-foreground">{selectedTicket.subject}</h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      selectedTicket.status === 'open'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : selectedTicket.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {selectedTicket.status === 'open'
                      ? (isAr ? 'قيد المتابعة 🟡' : 'Open 🟡')
                      : selectedTicket.status === 'resolved'
                      ? (isAr ? 'تم حل المشكلة 🟢' : 'Resolved 🟢')
                      : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {isAr ? `العميل: ${selectedTicket.user_name} (${selectedTicket.user_email}) — الحساب: ${selectedTicket.account_name}` : `Client: ${selectedTicket.user_name} (${selectedTicket.user_email}) — Account: ${selectedTicket.account_name}`}
                </p>
              </div>

              {/* Action Buttons for Admin */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start sm:self-auto">
                {selectedTicket.status === 'open' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateAdminStatus('resolved')}
                      disabled={updatingStatus}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1 h-8"
                    >
                      {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {isAr ? 'تم حل المشكلة ✅' : 'Mark Resolved ✅'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateAdminStatus('closed')}
                      disabled={updatingStatus}
                      className="text-xs font-bold gap-1 border-rose-500/50 text-rose-400 h-8"
                    >
                      {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      {isAr ? 'إغلاق 🛑' : 'Close 🛑'}
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs font-bold py-1 px-3">
                    🔒 {isAr ? 'مغلقة ومحسومة نهائياً' : 'Permanently Closed'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-[280px] sm:min-h-[320px] max-h-[480px] bg-background">
              {messagesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">{isAr ? 'لا توجد رسائل بعد' : 'No messages'}</p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin'
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdmin && (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 text-xs space-y-2 shadow-sm ${
                          isAdmin
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-card border border-border text-foreground rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-[10px] opacity-80">
                          <span className="font-bold">{isAdmin ? (isAr ? 'أنت (فريق الأدمن 🛡️)' : 'You (Admin 🛡️)') : (isAr ? `العميل: ${selectedTicket.user_name}` : `Client: ${selectedTicket.user_name}`)}</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>

                        {/* Image Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl overflow-hidden border border-white/20 hover:opacity-90 transition-opacity"
                              >
                                <img src={att.url} alt={att.name || 'Attachment'} className="max-h-48 w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Reply Footer or Closed Ticket Notice */}
            {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? (
              <div className="p-4 bg-muted/40 border-t border-border text-center text-xs text-muted-foreground font-semibold">
                🔒 {isAr ? 'تم حسم وإغلاق هذه التذكرة نهائياً. لا يمكن إضافة ردود إضافية عليها.' : 'This ticket is permanently closed. No further replies can be added.'}
              </div>
            ) : (
              <form onSubmit={handleSendAdminReply} className="p-3 border-t border-border bg-muted/20 space-y-2">
                {replyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {replyAttachments.map((att, idx) => (
                      <div key={idx} className="relative group rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-1 flex items-center gap-2 text-[10px]">
                        <img src={att.url} alt={att.name} className="h-6 w-6 object-cover rounded" />
                        <span className="truncate max-w-[100px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-400 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleAdminFileUpload(file)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => replyFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="h-9 w-9 text-muted-foreground hover:text-emerald-400 shrink-0"
                    title={isAr ? 'إرفاق صورة' : 'Attach Image'}
                  >
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>

                  <Input
                    type="text"
                    placeholder={isAr ? 'اكتب رد الأدمن الرسمي على العميل...' : 'Type admin reply...'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-background border-border text-xs h-9 flex-1"
                  />

                  <Button
                    type="submit"
                    disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs h-9 px-4 gap-1 shrink-0"
                  >
                    {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {isAr ? 'إرسال الرد' : 'Send Reply'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Broadcast Notification Modal */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-400" />
              {isAr ? 'إرسال إشعار / عرض شامل لجميع المستخدمين' : 'Send Broadcast to All Users'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr ? 'سيصل هذا الإشعار فانتظام إلى قسم تذاكر الدعم الفني لكافة الحسابات النشطة مع ظهور شارة مضيئة ومتحركة لهم' : 'This notification will arrive in support tickets for all active accounts with a glowing badge'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{isAr ? 'عنوان الإشعار / العرض:' : 'Notification Subject:'}</label>
              <Input
                type="text"
                required
                placeholder={isAr ? 'مثال: 🔥 عرض خاص 50% على الباقات أو 🚀 تحديث نظام جديد...' : 'e.g. 🔥 Special offer 50% off or 🚀 New system update...'}
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="bg-background border-border text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">{isAr ? 'نوع الإشعار:' : 'Category:'}</label>
                <select
                  value={broadcastCategory}
                  onChange={(e: any) => setBroadcastCategory(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="announcement">{isAr ? 'إعلان عام 📢' : 'Announcement 📢'}</option>
                  <option value="offer">{isAr ? 'عرض خاص / خصومات 🎁' : 'Special Offer 🎁'}</option>
                  <option value="update">{isAr ? 'تحديث جديد للمنصة 🚀' : 'Platform Update 🚀'}</option>
                  <option value="general">{isAr ? 'عام / General' : 'General'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">{isAr ? 'الأولوية والأهمية:' : 'Priority:'}</label>
                <select
                  value={broadcastPriority}
                  onChange={(e: any) => setBroadcastPriority(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="high">{isAr ? 'عالية (موصى به) 🔥' : 'High 🔥'}</option>
                  <option value="urgent">{isAr ? 'عاجلة جداً 🚨' : 'Urgent 🚨'}</option>
                  <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{isAr ? 'تفاصيل الرسالة والعروض / روابط:' : 'Message Content & Links:'}</label>
              <textarea
                rows={4}
                required
                placeholder={isAr ? 'اكتب كافة التفاصيل، العروض، الروابط والشروط...' : 'Write all message details, links, and text...'}
                value={broadcastMessageText}
                onChange={(e) => setBroadcastMessageText(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground resize-none leading-relaxed"
              />
            </div>

            {/* Banner / Offer Image Upload */}
            <div className="space-y-2">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>{isAr ? 'صورة العرض / البانر (إختياري):' : 'Offer Banner Image (Optional):'}</span>
                <input
                  type="file"
                  ref={broadcastFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBroadcastFileUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => broadcastFileInputRef.current?.click()}
                  disabled={uploadingBroadcastImage}
                  className="text-xs font-bold gap-1"
                >
                  {uploadingBroadcastImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />}
                  {isAr ? 'إرفاق صورة بانر 🖼️' : 'Upload Banner 🖼️'}
                </Button>
              </label>

              {broadcastAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {broadcastAttachments.map((att, idx) => (
                    <div key={idx} className="relative group rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-1 flex items-center gap-2 text-xs">
                      <img src={att.url} alt={att.name} className="h-10 w-10 object-cover rounded-lg" />
                      <span className="truncate max-w-[140px] text-[11px] font-bold">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setBroadcastAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 p-1 hover:bg-rose-500/10 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBroadcastOpen(false)}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={sendingBroadcast}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
              >
                {sendingBroadcast ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                {isAr ? 'إرسال الإشعار لجميع الحسابات 🚀' : 'Broadcast to All Accounts 🚀'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Campaign Detailed Report Modal */}
      {selectedCampaign && (
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-3xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  {isAr ? `تقرير فتح إشعار: ${selectedCampaign.title}` : `Campaign Report: ${selectedCampaign.title}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? `تاريخ الإرسال: ${new Date(selectedCampaign.created_at).toLocaleString()}` : `Sent: ${new Date(selectedCampaign.created_at).toLocaleString()}`}
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                {selectedCampaign.open_rate}% {isAr ? 'نسبة الفتح والقراءة' : 'Open Rate'}
              </Badge>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-background">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-[10px] text-muted-foreground font-bold">{isAr ? 'عدد الحسابات المستلمة' : 'Total Delivered'}</span>
                  <p className="text-xl font-black text-foreground">{selectedCampaign.total_delivered}</p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold">{isAr ? 'قاموا بفتح الإشعار' : 'Opened / Read'}</span>
                  <p className="text-xl font-black text-emerald-400">{selectedCampaign.total_opened}</p>
                </div>
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                  <span className="text-[10px] text-amber-400 font-bold">{isAr ? 'لم يفتحوا الإشعار بعد' : 'Pending Open'}</span>
                  <p className="text-xl font-black text-amber-400">{selectedCampaign.total_delivered - selectedCampaign.total_opened}</p>
                </div>
              </div>

              {/* Recipients Detailed Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">{isAr ? 'تفاصيل قراءة الحسابات والمستخدمين:' : 'Recipients Read Status:'}</h4>
                {reportLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recipientsReport.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">{isAr ? 'لا توجد بيانات متاحة' : 'No recipient data'}</p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
                    {recipientsReport.map((r) => (
                      <div key={r.ticket_id} className="p-3 flex items-center justify-between gap-3 bg-background hover:bg-muted/20">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-foreground truncate">{r.account_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.user_name} ({r.user_email})</p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            r.is_read
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.read_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
