"use client";

import { Check, Moon, Palette, SunMoon, Sun, RefreshCw, Sparkles } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { MODES, THEMES, DEFAULT_THEME, DEFAULT_MODE, type Mode, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { SettingsPanelHead } from "./settings-panel-head";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Appearance panel — light/dark mode + accent-color picker + reset.
 */
export function AppearancePanel() {
  const { theme, setTheme, mode, setMode } = useTheme();
  const t = useTranslations("Settings.appearance");
  const locale = useLocale();
  const isAr = locale === "ar";

  const handleResetToDefault = () => {
    setTheme(DEFAULT_THEME);
    setMode(DEFAULT_MODE);
    toast.success(
      isAr
        ? "تمت استعادة المظهر الافتراضي لنظام Ethos Automation بنجاح! 🎉"
        : "Restored official Ethos Automation design system defaults! 🎉"
    );
  };

  return (
    <section className="max-w-3xl animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 mb-6">
        <SettingsPanelHead
          title={t("title")}
          description={t("description")}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetToDefault}
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs shadow-sm self-start sm:self-center gap-1.5 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isAr ? "إعادة التعيين للوضع الافتراضي (Reset)" : "Reset to Default (DESIGN.md)"}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SunMoon className="size-4 text-muted-foreground" />
          {t("mode")}
        </h3>

        <div
          role="radiogroup"
          aria-label="Color mode"
          className="grid max-w-md grid-cols-2 gap-3"
        >
          {MODES.map((m) => (
            <ModeCard
              key={m}
              mode={m}
              isActive={m === mode}
              onPick={() => setMode(m)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Palette className="size-4 text-muted-foreground" />
            {t("accentColor")}
          </h3>
          <span className="text-[11px] text-muted-foreground font-medium">
            {isAr ? "نظام الألوان الرسمية والسمات المتاحة" : "Official Color Themes"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((tObj) => (
            <ThemeCard
              key={tObj.id}
              id={tObj.id}
              name={tObj.name}
              tagline={tObj.tagline}
              swatch={tObj.swatch}
              isActive={tObj.id === theme}
              isEthos={tObj.id === "ethos"}
              onPick={() => setTheme(tObj.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  mode,
  isActive,
  onPick,
}: {
  mode: Mode;
  isActive: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("Settings.appearance");
  const isLight = mode === "light";
  const Icon = isLight ? Sun : Moon;
  return (
    <button
      type="button"
      role="radio"
      onClick={onPick}
      aria-checked={isActive}
      aria-label={t("useMode", { mode })}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold capitalize text-foreground">
        {mode}
      </span>
      {isActive && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          <Check className="h-3 w-3" />
          {t("active")}
        </span>
      )}
    </button>
  );
}

function ThemeCard({
  id,
  name,
  tagline,
  swatch,
  isActive,
  isEthos,
  onPick,
}: {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  isActive: boolean;
  isEthos?: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("Settings.appearance");
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={t("useTheme", { name })}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors overflow-hidden",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      {isEthos && (
        <div className="absolute top-0 end-0 bg-primary/15 border-b border-s border-primary/30 px-2 py-0.5 rounded-es-md text-[9px] font-bold text-primary flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" />
          DESIGN.md
        </div>
      )}
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: swatch,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        />
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            {t("active")}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {tagline}
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: swatch }} />
        <span className="w-3 bg-muted-foreground/60" />
        <span className="w-3 bg-muted" />
        <span className="w-3 bg-card" />
      </div>
      <span className="sr-only">Theme id: {id}</span>
    </button>
  );
}
