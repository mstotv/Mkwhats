'use client';

import { useState, useEffect } from 'react';
import { Contact } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Merge, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface MergeContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact1: Contact;
  contact2: Contact;
  onMerged: () => void;
}

export function MergeContactsModal({
  open,
  onOpenChange,
  contact1,
  contact2,
  onMerged,
}: MergeContactsModalProps) {
  const t = useTranslations('Contacts.mergeModal');
  const [primaryId, setPrimaryId] = useState<string>(contact1.id);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (open) {
      setPrimaryId(contact1.id);
    }
  }, [open, contact1.id]);

  const primaryContact = primaryId === contact1.id ? contact1 : contact2;
  const secondaryContact = primaryId === contact1.id ? contact2 : contact1;

  const handleMerge = async () => {
    setMerging(true);
    try {
      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryContactId: primaryContact.id,
          secondaryContactId: secondaryContact.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || t('errorMerge'));
      }

      toast.success(t('successMerge'));
      onOpenChange(false);
      onMerged();
    } catch (err: any) {
      toast.error(err.message || t('errorMerge'));
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Merge className="size-5" />
            <DialogTitle>{t('title')}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instructions */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t('warningTitle')}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{t('warningText')}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-foreground">
            {t('choosePrimary')}
          </p>

          {/* Cards to choose primary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contact 1 */}
            <div
              onClick={() => setPrimaryId(contact1.id)}
              className={`relative p-3 rounded-xl border cursor-pointer transition-all ${
                primaryId === contact1.id
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background hover:border-border/80'
              }`}
            >
              {primaryId === contact1.id && (
                <span className="absolute top-2 end-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3" /> {t('primaryBadge')}
                </span>
              )}
              <h4 className="font-bold text-sm text-foreground truncate pe-12">
                {contact1.name || t('unnamed')}
              </h4>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {contact1.phone}
              </p>
              {contact1.email && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {contact1.email}
                </p>
              )}
              {contact1.company && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {contact1.company}
                </p>
              )}
            </div>

            {/* Contact 2 */}
            <div
              onClick={() => setPrimaryId(contact2.id)}
              className={`relative p-3 rounded-xl border cursor-pointer transition-all ${
                primaryId === contact2.id
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background hover:border-border/80'
              }`}
            >
              {primaryId === contact2.id && (
                <span className="absolute top-2 end-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3" /> {t('primaryBadge')}
                </span>
              )}
              <h4 className="font-bold text-sm text-foreground truncate pe-12">
                {contact2.name || t('unnamed')}
              </h4>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {contact2.phone}
              </p>
              {contact2.email && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {contact2.email}
                </p>
              )}
              {contact2.company && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {contact2.company}
                </p>
              )}
            </div>
          </div>

          {/* Merge summary */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('mergingFrom')}:</span>
              <span className="font-semibold text-foreground line-through opacity-75">
                {secondaryContact.name || secondaryContact.phone}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('mergingInto')}:</span>
              <span className="font-semibold text-primary">
                {primaryContact.name || primaryContact.phone}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={merging}
            className="border-border text-xs"
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleMerge}
            disabled={merging}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5"
          >
            {merging ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Merge className="size-3.5" />
            )}
            {t('confirmMerge')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
