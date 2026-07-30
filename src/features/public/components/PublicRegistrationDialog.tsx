'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

const publicRegistrationSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z.string().optional(),
  address: z.string().min(1, 'Blok Rumah / Alamat wajib diisi'),
  note: z.string().optional(),
});

type PublicRegistrationData = z.infer<typeof publicRegistrationSchema>;

interface PublicRegistrationDialogProps {
  competitionId: string;
  competitionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PublicRegistrationDialog({
  competitionId,
  competitionTitle,
  isOpen,
  onClose,
  onSuccess,
}: PublicRegistrationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicRegistrationData>({
    resolver: zodResolver(publicRegistrationSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      address: '',
      note: '',
    },
  });

  const onSubmit = async (data: PublicRegistrationData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedName = toTitleCase(data.full_name);
      const formattedAddress = toTitleCase(data.address);

      // Cari apakah peserta dengan nama dan alamat yang sama persis sudah ada
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .ilike('full_name', formattedName)
        .eq('address', formattedAddress)
        .limit(1)
        .single();

      let participantId = existingParticipant?.id;

      if (!participantId) {
        // Buat peserta baru
        const { data: pData, error: pError } = await supabase
          .from('participants')
          .insert([{ full_name: formattedName, phone: data.phone || null, address: formattedAddress, note: data.note || null }])
          .select('id')
          .single();

        if (pError) throw pError;
        participantId = pData.id;
      }

      // Daftar ke lomba (cek apakah sudah terdaftar sebelumnya)
      const { data: existingRegistration } = await supabase
        .from('registrations')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('participant_id', participantId)
        .limit(1)
        .single();

      if (existingRegistration) {
        throw new Error('Anda sudah terdaftar di lomba ini sebelumnya.');
      }

      const { error: rError } = await supabase
        .from('registrations')
        .insert([{ competition_id: competitionId, participant_id: participantId }]);

      if (rError) throw rError;

      setIsSuccess(true);
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-surface rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {isSuccess ? 'Pendaftaran Berhasil!' : 'Daftar Lomba'}
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-slate-600">
            {isSuccess ? (
              'Terima kasih telah mendaftar.'
            ) : (
              <>Pendaftaran untuk <span className="font-bold text-slate-800">{competitionTitle}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle2 className="w-20 h-20 text-green-500" />
              <p className="text-center text-slate-600 font-medium text-lg">
                Anda telah resmi terdaftar di lomba {competitionTitle}!
              </p>
              <Button onClick={handleClose} className="mt-4 bg-primary text-on-primary rounded-xl px-8 w-full h-12 text-lg">
                Tutup
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md border border-red-200">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap / Nama Tim</Label>
                <Input
                  id="full_name"
                  placeholder="Misal: Andi Saputra"
                  {...register('full_name')}
                />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. Handphone (Opsional)</Label>
                <Input
                  id="phone"
                  placeholder="Misal: 08123456789"
                  {...register('phone')}
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Blok Rumah / Alamat</Label>
                <Input
                  id="address"
                  placeholder="Misal: Blok A No. 12 / RT 04"
                  {...register('address')}
                />
                {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan (Opsional)</Label>
                <Input
                  id="note"
                  placeholder="Misal: Bawa alat sendiri"
                  {...register('note')}
                />
                {errors.note && <p className="text-red-500 text-xs">{errors.note.message}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-xl h-12 text-base"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-on-primary rounded-xl h-12 text-base px-8">
                  {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
