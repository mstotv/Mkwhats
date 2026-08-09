'use client'

import { useState } from 'react'
import { EditMemberModal, type MemberToEdit } from './edit-member-modal'
import { ImpersonateButton } from './impersonate-button'
import { Mail, UserCheck, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface MemberItem {
  user_id: string
  full_name: string
  email: string
  account_role: string
  created_at: string
  last_sign_in_at: string | null
}

interface AccountMembersTableProps {
  members: MemberItem[]
  accountId: string
  accountName: string
}

const roleTranslations: Record<string, string> = {
  owner: 'المالك (Owner)',
  admin: 'مدير (Admin)',
  agent: 'وكيل (Agent)',
  viewer: 'مراقب (Viewer)',
}

export function AccountMembersTable({
  members,
  accountId,
  accountName,
}: AccountMembersTableProps) {
  const [selectedMember, setSelectedMember] = useState<MemberToEdit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEditClick = (member: MemberItem) => {
    setSelectedMember({
      user_id: member.user_id,
      full_name: member.full_name,
      email: member.email,
    })
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto font-sans">
        <table className="w-full text-right text-xs text-slate-300">
          <thead className="border-b border-slate-800/60 bg-slate-950/50 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-5">اسم العضو</th>
              <th className="py-3 px-5">البريد الإلكتروني</th>
              <th className="py-3 px-5">الدور (Role)</th>
              <th className="py-3 px-5">تاريخ الانضمام</th>
              <th className="py-3 px-5">آخر تسجيل دخول</th>
              <th className="py-3 px-5 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {members.length > 0 ? (
              members.map((member) => (
                <tr
                  key={member.user_id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3.5 px-5 font-semibold text-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700/50 text-slate-300 text-xs font-bold uppercase">
                        {member.full_name?.charAt(0) || 'U'}
                      </div>
                      <span>{member.full_name || 'بدون اسم'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span>{member.email}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-medium border ${
                        member.account_role === 'owner'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : member.account_role === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/50'
                      }`}
                    >
                      <UserCheck className="h-3 w-3" />
                      {roleTranslations[member.account_role] || member.account_role}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-slate-400">
                    {new Date(member.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                    {member.last_sign_in_at ? (
                      new Date(member.last_sign_in_at).toLocaleDateString(
                        'ar-SA',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )
                    ) : (
                      <span className="text-slate-500 font-sans">
                        لم يسجل دخول بعد
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <ImpersonateButton
                        targetUserId={member.user_id}
                        targetUserName={member.full_name || member.email}
                        accountId={accountId}
                        accountName={accountName}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(member)}
                        className="h-7 text-xs px-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 gap-1 border border-slate-800 hover:border-indigo-500/30"
                      >
                        <Edit2 className="h-3 w-3" />
                        تعديل
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500 text-xs"
                >
                  لا يوجد أعضاء مسجلين لهذا الحساب بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditMemberModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
