"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ModeToggle({ className }: { className?: string }) {
  const t = useTranslations("ModeToggle");
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goingTo = mode === "dark" ? "light" : "dark";
  const switchLabel = mounted ? t("switchMode", { mode: goingTo }) : "Switch theme mode";

  return (
    <button
      type="button"
      onClick={(e) => toggleMode(e)}
      aria-label={switchLabel}
      title={switchLabel}
      suppressHydrationWarning
      className={cn(
        "relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-slate-700 dark:text-zinc-200 transition-all hover:bg-slate-100 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 shrink-0 cursor-pointer overflow-hidden shadow-xs",
        className,
      )}
    >
      <Sun className="h-4.5 w-4.5 text-amber-500 transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4.5 w-4.5 text-teal-400 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
