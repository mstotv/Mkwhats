export type BusinessType = 'retail' | 'clinic' | 'salon' | 'cafe' | 'bio' | 'custom'

export interface ThemeConfig {
  primary_color: string
  accent_color: string
  style: 'modern' | 'minimal' | 'luxury' | 'bento'
  font: 'cairo' | 'tajawal' | 'alexandria' | 'inter'
  rounded: 'rounded-lg' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full'
  theme_preset?: string
  background_style?: 'dark' | 'midnight' | 'warm_coffee' | 'rose_luxury' | 'clean_light'
  dark_mode?: 'auto' | 'light' | 'dark'
  button_shape?: 'pill' | 'soft' | 'rounded' | 'sharp'
  icon_style?: 'filled' | 'outline' | 'soft_bg' | 'mono'
  button_color?: string
  button_text_color?: string
  verified?: boolean
  verified_color?: string
  banner_mode?: 'background' | 'banner'
}

export interface ContactButtons {
  whatsapp_enabled: boolean
  whatsapp_number: string
  whatsapp_welcome_message?: string
  phone_enabled: boolean
  phone_number: string
  instagram?: string
  tiktok?: string
  telegram?: string
  twitter?: string
  facebook?: string
  youtube?: string
  linkedin?: string
  snapchat?: string
  maps_url?: string
}

export type CustomLinkIcon =
  | 'link'
  | 'globe'
  | 'sparkles'
  | 'book'
  | 'video'
  | 'download'
  | 'shopping'
  | 'calendar'
  | 'music'
  | 'star'
  | string

export interface ImageCardData {
  src: string
  caption?: string
  description?: string
}

export interface CustomLinkButton {
  id: string
  title: string
  url: string
  subtitle?: string
  icon?: CustomLinkIcon
  image_url?: string
  highlight?: boolean
  is_active?: boolean
  type?: 'link' | 'image_card'
  image_card?: ImageCardData
  bg_color?: string
  text_color?: string
  icon_color?: string
  btn_shape?: 'pill' | 'soft' | 'rounded' | 'sharp'
}

export interface StorefrontAnalyticsSummary {
  total_visits: number
  unique_visits: number
  last_7_days: number
  last_30_days: number
  top_links: {
    link_id: string
    title: string
    url: string
    clicks: number
  }[]
}

export interface StorefrontSettings {
  enable_whatsapp_confirmation: boolean
  enable_telegram_notifications: boolean
  enable_appointments: boolean
  enable_direct_orders: boolean
  order_success_message?: string
  appointment_success_message?: string
  // Customizable section texts & button labels
  appointment_headline?: string
  appointment_subheadline?: string
  appointment_button_text?: string
  hero_badge?: string
  hero_headline?: string
  hero_subtitle?: string
  hero_button_text?: string
  products_title?: string
  products_subtitle?: string
  services_title?: string
  services_subtitle?: string
  // Custom Link Buttons
  custom_links?: CustomLinkButton[]
}

export interface StorefrontItem {
  id: string
  account_id: string
  storefront_id: string
  type: 'product' | 'service'
  title: string
  description?: string | null
  price: number
  compare_at_price?: number | null
  image_url?: string | null
  category?: string | null
  duration_minutes?: number | null
  is_available: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface StorefrontFullConfig {
  id: string
  account_id: string
  subdomain: string
  store_name: string | null
  is_active: boolean
  business_type: BusinessType
  theme_config: ThemeConfig
  logo_url: string | null
  banner_url: string | null
  bio: string | null
  contact_buttons: ContactButtons
  sections_order: string[]
  settings: StorefrontSettings
  created_at: string
  updated_at: string
}
