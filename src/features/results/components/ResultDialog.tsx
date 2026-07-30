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
import { ResultForm } from './ResultForm';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface ResultDialogProps {
  competitionId: string;
  competitionTitle: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResultDialog({ competitionId, competitionTitle, trigger, open, onOpenChange }: ResultDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : !isControlled && !trigger ? (
        <DialogTrigger
          render={
            <Button variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700">
              <Trophy className="mr-2 h-4 w-4" /> Input Juara
            </Button>
          }
        />
      ) : null}

      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-surface rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Hasil Lomba
          </DialogTitle>
          <DialogDescription className="text-body-md text-secondary/80">
            Pilih pemenang untuk <strong>{competitionTitle}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-4">
          <ResultForm
            competitionId={competitionId}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
