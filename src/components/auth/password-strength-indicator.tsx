'use client';

import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'ضعيفة جداً', color: 'bg-rose-500', textColor: 'text-rose-500' };
      case 2:
        return { score: 2, label: 'مقبولة', color: 'bg-amber-500', textColor: 'text-amber-500' };
      case 3:
        return { score: 3, label: 'قوية', color: 'bg-blue-500', textColor: 'text-blue-500' };
      case 4:
        return { score: 4, label: 'قوية جداً وممتازة', color: 'bg-purple-600', textColor: 'text-purple-600' };
      default:
        return { score: 0, label: 'ضعيفة', color: 'bg-slate-300', textColor: 'text-slate-400' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-[#71717A]">قوة كلمة المرور:</span>
        <span className={strength.textColor}>{strength.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-full rounded-full transition-all duration-300 ${
              level <= strength.score ? strength.color : 'bg-[#E4E4E7]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
