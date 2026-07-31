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
import { CompetitionForm } from './CompetitionForm';
import { CompetitionFormData } from '../schemas/competition-schema';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CompetitionDialogProps {
  initialData?: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CompetitionDialog({ initialData, trigger, open, onOpenChange }: CompetitionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) :   null}

      <DialogContent className="sm:max-w-[425px] md:max-w-[500px] p-0 bg-surface rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="text-headline-sm font-bold text-on-surface">
            {initialData ? 'Edit Lomba' : 'Tambah Lomba Baru'}
          </DialogTitle>
          <DialogDescription className="text-body-md text-secondary/80">
            Isi detail lomba di bawah ini sesuai dengan event yang dituju.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-4 overflow-y-auto">
          <CompetitionForm
            initialData={initialData}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
