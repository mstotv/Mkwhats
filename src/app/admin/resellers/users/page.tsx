'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  Search,
  RefreshCw,
  Network,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Mail,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResellerTabs } from '../_components/reseller-tabs';

interface SubAccount {
  id: string;
  name: string;
  created_at: string;
  is_suspended: boolean;
  reseller_id: string;
  reseller?: {
    id: string;
    display_name: string;
    display_name_ar?: string;
    subdomain: string;
  };
  profiles?: Array<{
    id: string;
    email: string;
    full_name?: string;
    account_role: string;
  }>;
  subscriptions?: Array<{
    id: string;
    status: string;
    billing_cycle: string;
    plan?: { id: string; name: string };
  }>;
}

interface ResellerAdminUser {
  id: string;
  reseller_id: string;
  user_id: string;
  role: string;
  created_at: string;
  reseller?: {
    id: string;
    display_name: string;
    subdomain: string;
  };
}

export default function ResellerUsersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SubAccount[]>([]);
  const [admins, setAdmins] = useState<ResellerAdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<'accounts' | 'admins'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResellerId, setSelectedResellerId] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resellers/users');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
        setAdmins(data.admins || []);
      } else {
        toast.error(data.error || 'Failed to load reseller accounts');
      }
    } catch {
      toast.error('Network error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique list of resellers for filter dropdown
  const uniqueResellers = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => {
      if (acc.reseller) {
        map.set(acc.reseller.id, acc.reseller.display_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.reseller?.display_name && acc.reseller.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (acc.reseller?.subdomain && acc.reseller.subdomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (acc.profiles && acc.profiles.some((p) => p.email?.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesReseller = selectedResellerId === 'all' || acc.reseller_id === selectedResellerId;
      return matchesSearch && matchesReseller;
    });
  }, [accounts, searchQuery, selectedResellerId]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((adm) => {
      const matchesSearch =
        (adm.reseller?.display_name && adm.reseller.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (adm.reseller?.subdomain && adm.reseller.subdomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        adm.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesReseller = selectedResellerId === 'all' || adm.reseller_id === selectedResellerId;
      return matchesSearch && matchesReseller;
    });
  }, [admins, searchQuery, selectedResellerId]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-emerald-500" />
            <span>{isAr ? 'حسابات ومستخدمو شبكة الريسيلر' : 'Reseller Sub-Accounts & Staff Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAr
              ? 'مراقبة جميع الشركات والحسابات الفرعية المنشأة بواسطة الموزعين ومدراء كل ريسيلر.'
              : 'Monitor end-client accounts deployed under white-label tenants and reseller staff.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="rounded-xl border-border h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ResellerTabs />

      {/* Toggle View: Sub-Accounts vs Admins */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'bg-foreground text-background shadow-xs'
              : 'bg-muted/70 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{isAr ? 'الشركات الفرعية التابعة' : 'Sub-Accounts'}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {accounts.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-foreground text-background shadow-xs'
              : 'bg-muted/70 text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{isAr ? 'مدراء وموظفو الريسيلر' : 'Reseller Staff'}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {admins.length}
          </Badge>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالشركة، الريسيلر، أو البريد...' : 'Search account, reseller, email...'}
              className="ps-9 rounded-xl border-border bg-background h-9 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={selectedResellerId}
              onChange={(e) => setSelectedResellerId(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">{isAr ? 'جميع الموزعين' : 'All Resellers'}</option>
              {uniqueResellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {activeTab === 'accounts' ? (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-start font-bold">{isAr ? 'اسم الشركة / الحساب' : 'Company Account'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'الريسيلر التابع له' : 'Parent Reseller'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'المالك / المستخدمين' : 'Owner / Users'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'الخطة والاشتراك' : 'Plan'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'تاريخ الإنشاء' : 'Created At'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      <span className="text-xs">{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm font-semibold">{isAr ? 'لا توجد شركات مسجلة تحت هذا التصنيف' : 'No sub-accounts found'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((acc) => {
                    const primaryUser = acc.profiles?.[0];
                    const activeSub = acc.subscriptions?.[0];

                    return (
                      <TableRow key={acc.id} className="hover:bg-muted/30">
                        {/* Account Name */}
                        <TableCell className="font-bold text-xs sm:text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <span>{acc.name}</span>
                          </div>
                        </TableCell>

                        {/* Parent Reseller */}
                        <TableCell>
                          {acc.reseller ? (
                            <div>
                              <div className="font-semibold text-xs text-foreground">
                                {acc.reseller.display_name}
                              </div>
                              <span className="text-[11px] font-mono text-emerald-500">
                                {acc.reseller.subdomain}.mstoviral.online
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{isAr ? 'مباشر' : 'Direct'}</span>
                          )}
                        </TableCell>

                        {/* Profiles / Owner */}
                        <TableCell>
                          {primaryUser ? (
                            <div className="text-xs space-y-0.5">
                              <div className="font-medium text-foreground">{primaryUser.full_name || primaryUser.email}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">{primaryUser.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">—</span>
                          )}
                        </TableCell>

                        {/* Plan */}
                        <TableCell>
                          {activeSub?.plan ? (
                            <Badge variant="outline" className="text-[10px] font-medium">
                              {activeSub.plan.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {acc.is_suspended ? (
                            <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 text-[10px]">
                              {isAr ? 'معلق' : 'Suspended'}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px]">
                              {isAr ? 'نشط' : 'Active'}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(acc.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-start font-bold">{isAr ? 'الريسيلر' : 'Reseller'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'معرف المستخدم (User ID)' : 'User ID'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'الرتبة والصلاحية' : 'Role'}</TableHead>
                  <TableHead className="text-start font-bold">{isAr ? 'تاريخ الإضافة' : 'Assigned At'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm font-semibold">{isAr ? 'لا يوجد مدراء ريسيلر حالياً' : 'No reseller staff found'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((adm) => (
                    <TableRow key={adm.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div>
                          <div>{adm.reseller?.display_name}</div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {adm.reseller?.subdomain}.mstoviral.online
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {adm.user_id}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] uppercase">
                          {adm.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(adm.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
