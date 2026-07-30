'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { participantSchema, ParticipantFormData } from '../schemas/participant-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ParticipantFormProps {
  initialData?: ParticipantFormData & { id?: string; registration_id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ParticipantForm({ initialData, onSuccess, onCancel }: ParticipantFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: competitions } = useQuery({
    queryKey: ['competitions-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('competitions').select('id, title, category_id').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: initialData || {
      competition_id: '',
      full_name: '',
      phone: '',
      address: '',
      note: '',
    },
  });

  const onSubmit = async (data: ParticipantFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let participantId = initialData?.id;

      if (!initialData?.id) {
        const formattedName = toTitleCase(data.full_name);
        const formattedAddress = data.address ? toTitleCase(data.address) : null;
        
        // Insert into participants
        const { data: pData, error: pError } = await supabase
          .from('participants')
          .insert([{ full_name: formattedName, phone: data.phone || null, address: formattedAddress, note: data.note || null }])
          .select('id')
          .single();

        if (pError) throw pError;
        participantId = pData.id;

        // Insert into registrations
        const { error: rError } = await supabase
          .from('registrations')
          .insert([{ competition_id: data.competition_id, participant_id: participantId }]);
          
        if (rError) throw rError;
      } else {
        const formattedName = toTitleCase(data.full_name);
        const formattedAddress = data.address ? toTitleCase(data.address) : null;

        // Update participant
        const { error: pError } = await supabase
          .from('participants')
          .update({ full_name: formattedName, phone: data.phone || null, address: formattedAddress, note: data.note || null })
          .eq('id', initialData.id);

        if (pError) throw pError;

        if (initialData.registration_id) {
          // Update registration competition if needed
          const { error: rError } = await supabase
            .from('registrations')
            .update({ competition_id: data.competition_id })
            .eq('id', initialData.registration_id);
          
          if (rError) throw rError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data peserta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="competition_id">Lomba yang Diikuti</Label>
        <select
          id="competition_id"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          {...register('competition_id')}
        >
          <option value="">Pilih Lomba...</option>
          {competitions?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} {c.category_id ? `(${c.category_id})` : ''}
            </option>
          ))}
        </select>
        {errors.competition_id && <p className="text-red-500 text-xs">{errors.competition_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nama Peserta / Tim</Label>
        <Input
          id="full_name"
          placeholder="Nama Lengkap / Nama Tim"
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
          placeholder="Misal: Bawa raket sendiri"
          {...register('note')}
        />
        {errors.note && <p className="text-red-500 text-xs">{errors.note.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary text-on-primary">
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
