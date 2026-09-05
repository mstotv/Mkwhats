import {
  Calendar,
  Coins,
  FileText,
  Headphones,
  KeyRound,
  LayoutGrid,
  Palette,
  PlugZap,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Tags,
  User,
  UsersRound,
  Zap,
  Store,
  Link2,
  type LucideIcon,
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  'overview',
  'profile',
  'security',
  'appearance',
  'plan',
  'support',
  'appointments',
  'whatsapp',
  'telegram',
  'integrations',
  'store',
  'templates',
  'quick-replies',
  'fields',
  'deals',
  'members',
  'api',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const DEFAULT_SECTION: SettingsSection = 'overview';

/** Rail grouping. `adminOnly` items are hidden for non-admins. */
export interface SectionMeta {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
  group: 'top' | 'account' | 'workspace';
}

export const SECTION_META: Record<SettingsSection, SectionMeta> = {
  overview: { id: 'overview', label: 'Overview', icon: LayoutGrid, group: 'top' },
  profile: { id: 'profile', label: 'Your profile', icon: User, group: 'account' },
  security: { id: 'security', label: 'Login & security', icon: Shield, group: 'account' },
  appearance: { id: 'appearance', label: 'Appearance', icon: Palette, group: 'account' },
  plan: { id: 'plan', label: 'Plan & Usage', icon: Sparkles, group: 'account' },
  support: { id: 'support', label: 'Contact Support', icon: Headphones, group: 'account' },
  appointments: { id: 'appointments', label: 'Appointments', icon: Calendar, group: 'workspace' },
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', icon: PlugZap, group: 'workspace' },
  telegram: { id: 'telegram', label: 'Telegram Bot', icon: Send, group: 'workspace' },
  integrations: { id: 'integrations', label: 'Integrations', icon: ShoppingBag, group: 'workspace' },
  store: { id: 'store', label: 'Bio Link', icon: Link2, group: 'workspace' },
  templates: { id: 'templates', label: 'Templates', icon: FileText, group: 'workspace' },
  'quick-replies': { id: 'quick-replies', label: 'Quick replies', icon: Zap, group: 'workspace' },
  fields: { id: 'fields', label: 'Fields & tags', icon: Tags, group: 'workspace' },
  deals: { id: 'deals', label: 'Deals & currency', icon: Coins, group: 'workspace' },
  members: { id: 'members', label: 'Team members', icon: UsersRound, group: 'workspace' },
  api: { id: 'api', label: 'API keys', icon: KeyRound, group: 'workspace' },
};

export const RAIL_GROUPS: { label: string | null; group: SectionMeta['group'] }[] = [
  { label: null, group: 'top' },
  { label: 'Account', group: 'account' },
  { label: 'Workspace', group: 'workspace' },
];

function isSection(value: string | null): value is SettingsSection {
  return !!value && (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

/**
 * Resolve a raw `?tab=` value to a section. Legacy tabs from the old
 * flat layout collapse onto their new home (Tags + Custom fields → the
 * merged "Fields & tags" section). Anything unknown falls back to the
 * Overview landing.
 */
export function resolveSection(raw: string | null): SettingsSection {
  if (raw === 'tags' || raw === 'custom-fields') return 'fields';
  if (isSection(raw)) return raw;
  return DEFAULT_SECTION;
}
