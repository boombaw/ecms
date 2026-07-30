'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormData } from '../schemas/event-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface EventFormProps {
  initialData?: EventFormData & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'Upcoming',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedName = toTitleCase(data.name);
      const formattedLocation = data.location ? toTitleCase(data.location) : '';

      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from('events')
          .update({
            ...data,
            name: formattedName,
            location: formattedLocation,
            slug: formattedName.toLowerCase().replace(/[\s_]+/g, '-'),
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('events').insert([
          {
            ...data,
            name: formattedName,
            location: formattedLocation,
            slug: formattedName.toLowerCase().replace(/[\s_]+/g, '-'),
          },
        ]);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Event</Label>
        <Input
          id="name"
          placeholder="Misal: Lomba 17 Agustusan RT 04"
          {...register('name')}
        />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi (Opsional)</Label>
        <Input
          id="description"
          placeholder="Keterangan event..."
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Tanggal Mulai</Label>
          <input 
            id="start_date" 
            type="date" 
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register('start_date')} 
          />
          {errors.start_date && (
            <p className="text-red-500 text-xs">{errors.start_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Tanggal Selesai</Label>
          <input 
            id="end_date" 
            type="date" 
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register('end_date')} 
          />
          {errors.end_date && (
            <p className="text-red-500 text-xs">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input
          id="location"
          placeholder="Misal: Lapangan Futsal / Musholla"
          {...register('location')}
        />
        {errors.location && (
          <p className="text-red-500 text-xs">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register('status')}
        >
          <option value="Draft">Draft</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Finished">Finished</option>
        </select>
        {errors.status && (
          <p className="text-red-500 text-xs">{errors.status.message}</p>
        )}
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
