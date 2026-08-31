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
      onClick={toggleMode}
      aria-label={switchLabel}
      title={switchLabel}
      suppressHydrationWarning
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 shrink-0 cursor-pointer",
        className,
      )}
    >
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="h-5 w-5 hidden dark:block" />
    </button>
  );
}
