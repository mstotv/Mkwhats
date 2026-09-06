import { redirect } from 'next/navigation';

export default function BioLinkPage() {
  redirect('/settings?tab=store');
}
