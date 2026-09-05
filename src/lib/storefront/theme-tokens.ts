import type { ThemeConfig, CustomLinkButton } from './types'

export interface ButtonShapeItem {
  id: string
  label: string
  labelAr: string
  labelEn: string
  class: string
  radius: string
}

export const BUTTON_SHAPES: readonly ButtonShapeItem[] = [
  { id: 'pill', label: 'مستدير كامل (Pill)', labelAr: 'مستدير كامل (Pill)', labelEn: 'Full Pill', class: 'rounded-full', radius: '9999px' },
  { id: 'soft', label: 'حواف ناعمة (Soft)', labelAr: 'حواف ناعمة (Soft)', labelEn: 'Soft Rounded', class: 'rounded-2xl', radius: '1rem' },
  { id: 'rounded', label: 'زوايا خفيفة (Rounded)', labelAr: 'زوايا خفيفة (Rounded)', labelEn: 'Rounded Corners', class: 'rounded-xl', radius: '0.75rem' },
  { id: 'sharp', label: 'زوايا حادة (Sharp)', labelAr: 'زوايا حادة (Sharp)', labelEn: 'Sharp Corners', class: 'rounded-none', radius: '0px' },
]

export interface IconStyleItem {
  id: string
  label: string
  labelAr: string
  labelEn: string
  description: string
  descAr: string
  descEn: string
}

export const ICON_STYLES: readonly IconStyleItem[] = [
  {
    id: 'soft_bg',
    label: 'خلفية ناعمة',
    labelAr: 'خلفية ناعمة',
    labelEn: 'Soft Background',
    description: 'أيقونة مع خلفية ملونة شفافة عصرية',
    descAr: 'أيقونة مع خلفية ملونة شفافة عصرية',
    descEn: 'Icon with modern tinted translucent background',
  },
  {
    id: 'outline',
    label: 'إطار فقط (Outline)',
    labelAr: 'إطار فقط (Outline)',
    labelEn: 'Outline Only',
    description: 'حدود خارجية واضحة وخلفية شفافة',
    descAr: 'حدود خارجية واضحة وخلفية شفافة',
    descEn: 'Crisp borders with transparent background',
  },
  {
    id: 'filled',
    label: 'ممتلئ (Solid)',
    labelAr: 'ممتلئ (Solid)',
    labelEn: 'Solid Filled',
    description: 'خلفية كاملة بلون صلب',
    descAr: 'خلفية كاملة بلون صلب',
    descEn: 'Full solid opaque background',
  },
  {
    id: 'mono',
    label: 'أحادي (Monochrome)',
    labelAr: 'أحادي (Monochrome)',
    labelEn: 'Monochrome',
    description: 'أيقونة بلون بسيط بدون تلوين زائد',
    descAr: 'أيقونة بلون بسيط بدون تلوين زائد',
    descEn: 'Subtle minimal icon without bright tint',
  },
]

export interface ThemeModeStyle {
  bgGradient: string
  textColor: string
  cardBg: string
  cardBorder: string
  cardHover: string
  cardText: string
  pillBg: string
  pillBorder: string
  pillText: string
  accentColor: string
  handleColor: string
}

export const THEME_PRESET_STYLES: Record<string, { light: ThemeModeStyle; dark: ThemeModeStyle }> = {
  neon_lime: {
    light: {
      bgGradient: 'radial-gradient(circle at 50% 5%, rgba(220, 242, 69, 0.22) 0%, rgba(248, 250, 252, 0.95) 45%, #f8fafc 100%)',
      textColor: 'text-slate-900',
      cardBg: 'bg-white/95',
      cardBorder: 'border-slate-200/90',
      cardHover: 'hover:bg-white hover:border-[#cae035]',
      cardText: 'text-slate-900',
      pillBg: 'bg-white/95',
      pillBorder: 'border-slate-200',
      pillText: 'text-slate-700',
      accentColor: '#dcf245',
      handleColor: 'text-[#b84cdb]',
    },
    dark: {
      bgGradient: 'radial-gradient(circle at 50% 5%, #182414 0%, #0c120a 45%, #050805 100%)',
      textColor: 'text-slate-100',
      cardBg: 'bg-[#0e160b]/90',
      cardBorder: 'border-[#263c1e]',
      cardHover: 'hover:bg-[#131d0f] hover:border-[#cae035]/60',
      cardText: 'text-white',
      pillBg: 'bg-[#0e160b]/90',
      pillBorder: 'border-[#263c1e]',
      pillText: 'text-slate-200',
      accentColor: '#dcf245',
      handleColor: 'text-[#dcf245]',
    },
  },
  cyber_dark: {
    light: {
      bgGradient: 'radial-gradient(circle at 50% 5%, rgba(56, 189, 248, 0.2) 0%, rgba(240, 249, 255, 0.95) 45%, #f0f9ff 100%)',
      textColor: 'text-slate-900',
      cardBg: 'bg-white/95',
      cardBorder: 'border-sky-200/90',
      cardHover: 'hover:bg-white hover:border-sky-400',
      cardText: 'text-slate-900',
      pillBg: 'bg-white/95',
      pillBorder: 'border-sky-200',
      pillText: 'text-slate-700',
      accentColor: '#0284c7',
      handleColor: 'text-sky-600',
    },
    dark: {
      bgGradient: 'radial-gradient(circle at 50% 5%, #0a192f 0%, #030a16 45%, #01040a 100%)',
      textColor: 'text-slate-100',
      cardBg: 'bg-[#061224]/90',
      cardBorder: 'border-[#132c52]',
      cardHover: 'hover:bg-[#0a1c38] hover:border-sky-400/60',
      cardText: 'text-white',
      pillBg: 'bg-[#061224]/90',
      pillBorder: 'border-[#132c52]',
      pillText: 'text-sky-200',
      accentColor: '#38bdf8',
      handleColor: 'text-sky-400',
    },
  },
  rose_luxury: {
    light: {
      bgGradient: 'radial-gradient(circle at 50% 5%, rgba(244, 63, 94, 0.18) 0%, rgba(255, 241, 242, 0.95) 45%, #fff1f2 100%)',
      textColor: 'text-slate-900',
      cardBg: 'bg-white/95',
      cardBorder: 'border-rose-200/90',
      cardHover: 'hover:bg-white hover:border-rose-400',
      cardText: 'text-slate-900',
      pillBg: 'bg-white/95',
      pillBorder: 'border-rose-200',
      pillText: 'text-slate-700',
      accentColor: '#f43f5e',
      handleColor: 'text-rose-600',
    },
    dark: {
      bgGradient: 'radial-gradient(circle at 50% 5%, #2a0b1c 0%, #15050e 45%, #0a0207 100%)',
      textColor: 'text-slate-100',
      cardBg: 'bg-[#1c0813]/90',
      cardBorder: 'border-[#45142f]',
      cardHover: 'hover:bg-[#260c1b] hover:border-rose-400/60',
      cardText: 'text-white',
      pillBg: 'bg-[#1c0813]/90',
      pillBorder: 'border-[#45142f]',
      pillText: 'text-rose-200',
      accentColor: '#fb7185',
      handleColor: 'text-rose-400',
    },
  },
  warm_mocha: {
    light: {
      bgGradient: 'radial-gradient(circle at 50% 5%, rgba(217, 119, 6, 0.18) 0%, rgba(254, 243, 199, 0.45) 45%, #fefcf9 100%)',
      textColor: 'text-slate-900',
      cardBg: 'bg-white/95',
      cardBorder: 'border-amber-200/90',
      cardHover: 'hover:bg-white hover:border-amber-400',
      cardText: 'text-slate-900',
      pillBg: 'bg-white/95',
      pillBorder: 'border-amber-200',
      pillText: 'text-slate-700',
      accentColor: '#d97706',
      handleColor: 'text-amber-700',
    },
    dark: {
      bgGradient: 'radial-gradient(circle at 50% 5%, #24140b 0%, #130a05 45%, #080402 100%)',
      textColor: 'text-slate-100',
      cardBg: 'bg-[#180e07]/90',
      cardBorder: 'border-[#3d2312]',
      cardHover: 'hover:bg-[#21130a] hover:border-amber-400/60',
      cardText: 'text-white',
      pillBg: 'bg-[#180e07]/90',
      pillBorder: 'border-[#3d2312]',
      pillText: 'text-amber-200',
      accentColor: '#f59e0b',
      handleColor: 'text-amber-400',
    },
  },
  pure_emerald: {
    light: {
      bgGradient: 'radial-gradient(circle at 50% 5%, rgba(16, 185, 129, 0.2) 0%, rgba(236, 253, 245, 0.95) 45%, #f0fdf4 100%)',
      textColor: 'text-slate-900',
      cardBg: 'bg-white/95',
      cardBorder: 'border-emerald-200/90',
      cardHover: 'hover:bg-white hover:border-emerald-400',
      cardText: 'text-slate-900',
      pillBg: 'bg-white/95',
      pillBorder: 'border-emerald-200',
      pillText: 'text-slate-700',
      accentColor: '#059669',
      handleColor: 'text-emerald-700',
    },
    dark: {
      bgGradient: 'radial-gradient(circle at 50% 5%, #09261a 0%, #04140d 45%, #020805 100%)',
      textColor: 'text-slate-100',
      cardBg: 'bg-[#061c13]/90',
      cardBorder: 'border-[#114731]',
      cardHover: 'hover:bg-[#0a291c] hover:border-emerald-400/60',
      cardText: 'text-white',
      pillBg: 'bg-[#061c13]/90',
      pillBorder: 'border-[#114731]',
      pillText: 'text-emerald-200',
      accentColor: '#34d399',
      handleColor: 'text-emerald-400',
    },
  },
}

export function getThemePresetStyle(presetId?: string, isDark = false): ThemeModeStyle {
  const key = presetId && THEME_PRESET_STYLES[presetId] ? presetId : 'neon_lime'
  const preset = THEME_PRESET_STYLES[key]
  return isDark ? preset.dark : preset.light
}

export function getButtonShapeClass(shape?: string): string {
  switch (shape) {
    case 'pill':
      return 'rounded-full'
    case 'sharp':
      return 'rounded-none'
    case 'rounded':
      return 'rounded-xl'
    case 'soft':
    default:
      return 'rounded-2xl'
  }
}

export function getIconContainerClasses(
  style: string | undefined,
  preset: { bgClass: string; textClass: string; borderClass: string },
  isHighlight: boolean
): string {
  if (isHighlight) {
    return 'bg-slate-900/10 text-slate-900 border-slate-900/15'
  }

  switch (style) {
    case 'outline':
      return `bg-transparent ${preset.textClass} border-2 ${preset.borderClass}`
    case 'filled':
      return `bg-current/10 ${preset.textClass} border-transparent shadow-xs`
    case 'mono':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
    case 'soft_bg':
    default:
      return `${preset.bgClass} ${preset.textClass} ${preset.borderClass}`
  }
}

export function getButtonStyles(
  btn: CustomLinkButton,
  themeConfig?: ThemeConfig,
  isDark = false
): {
  className: string
  style: React.CSSProperties
} {
  const isHighlight = Boolean(btn.highlight)
  const shape = btn.btn_shape || themeConfig?.button_shape || 'soft'
  const shapeClass = getButtonShapeClass(shape)
  const themeStyle = getThemePresetStyle(themeConfig?.theme_preset, isDark)

  const customBg = btn.bg_color || themeConfig?.button_color
  const customText = btn.text_color || themeConfig?.button_text_color

  const inlineStyle: React.CSSProperties = {}
  if (customBg && !isHighlight) {
    inlineStyle.backgroundColor = customBg
  }
  if (customText && !isHighlight) {
    inlineStyle.color = customText
  }

  let className = `w-full active:scale-[0.99] transition-all py-3 px-3.5 flex items-center justify-between cursor-pointer border ${shapeClass} `

  if (isHighlight) {
    className += 'bg-[#dcf245] hover:brightness-95 border-[#cae035]/80 shadow-[0_8px_24px_-4px_rgba(202,224,53,0.45)] text-slate-900 font-bold'
  } else if (!customBg) {
    className += `${themeStyle.cardBg} ${themeStyle.cardBorder} ${themeStyle.cardHover} ${themeStyle.cardText} shadow-xs`
  }

  return { className, style: inlineStyle }
}
