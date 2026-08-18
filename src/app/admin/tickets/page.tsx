import { AdminTicketsClient } from './tickets-client'

export const metadata = {
  title: 'إدارة تذاكر الدعم الفني | Support Tickets Manager',
  description: 'إدارة وتتبع وتأكيد حل تذاكر الدعم الفني وتواصل العملاء في المنصة',
}

export default function AdminTicketsPage() {
  return <AdminTicketsClient />
}
