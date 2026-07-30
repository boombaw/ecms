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
import { ParticipantForm } from './ParticipantForm';
import { ParticipantFormData } from '../schemas/participant-schema';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ParticipantDialogProps {
  initialData?: ParticipantFormData & { id?: string };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ParticipantDialog({ initialData, trigger, open, onOpenChange }: ParticipantDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) :  null}

      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-surface rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-headline-sm font-bold text-on-surface">
            {initialData ? 'Edit Peserta' : 'Pendaftaran Peserta Baru'}
          </DialogTitle>
          <DialogDescription className="text-body-md text-secondary/80">
            Pastikan nama peserta atau tim belum terdaftar pada lomba yang sama.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-4">
          <ParticipantForm
            initialData={initialData}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
