'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EventForm } from './EventForm';
import { EventFormData } from '../schemas/event-schema';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EventDialogProps {
  initialData?: EventFormData & { id?: string };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EventDialog({ initialData, trigger, open, onOpenChange }: EventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : null}

      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-surface rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-headline-sm font-bold text-on-surface">
            {initialData ? 'Edit Event' : 'Tambah Event Baru'}
          </DialogTitle>
          <DialogDescription className="text-body-md text-secondary/80">
            Isi detail event di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-4">
          <EventForm
            initialData={initialData}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
