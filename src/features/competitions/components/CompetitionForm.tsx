'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { competitionSchema, CompetitionFormData } from '../schemas/competition-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CompetitionFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Balita",
  "Anak SD",
  "Remaja",
  "Ibu-Ibu",
  "Bapak-Bapak",
  "Pasangan",
  "Campuran",
];

export function CompetitionForm({ initialData, onSuccess, onCancel }: CompetitionFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: events } = useQuery({
    queryKey: ['events-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, name').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: initialData ? {
      ...initialData,
      category_id: typeof initialData.category_id === 'string' ? [initialData.category_id] : initialData.category_id
    } : {
      event_id: '',
      category_id: [CATEGORIES[0]],
      title: '',
      type: 'Individu',
      schedule: '',
      location: '',
      max_participants: 50,
      status: 'Draft',
      notes: '',
    },
  });

  const selectedCategories = watch('category_id') || [];

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setValue('category_id', [...selectedCategories, category], { shouldValidate: true });
    } else {
      setValue('category_id', selectedCategories.filter((c: string) => c !== category), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CompetitionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedTitle = toTitleCase(data.title);
      const formattedLocation = data.location ? toTitleCase(data.location) : '';

      if (initialData?.id) {
        // Update: Only use the first selected category to avoid breaking existing row
        const updateData = { 
          ...data, 
          title: formattedTitle,
          location: formattedLocation,
          category_id: data.category_id[0] || CATEGORIES[0] 
        };
        const { error } = await supabase
          .from('competitions')
          .update(updateData)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert: map categories to multiple rows
        const insertData = data.category_id.map((cat: string) => ({
          ...data,
          title: formattedTitle,
          location: formattedLocation,
          category_id: cat
        }));
        
        const { error } = await supabase.from('competitions').insert(insertData);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data lomba');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="event_id">Event</Label>
        <select
          id="event_id"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          {...register('event_id')}
        >
          <option value="">Pilih Event...</option>
          {events?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {errors.event_id && <p className="text-red-500 text-xs">{errors.event_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Nama Lomba</Label>
        <Input
          id="title"
          placeholder="Misal: Tarik Tambang"
          {...register('title')}
        />
        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Kategori Usia (Bisa pilih lebih dari satu)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md bg-slate-50">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex items-center space-x-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                checked={selectedCategories.includes(c)}
                onChange={(e) => handleCategoryChange(c, e.target.checked)}
              />
              <span className="text-slate-700">{c}</span>
            </label>
          ))}
        </div>
        {errors.category_id && <p className="text-red-500 text-xs">{errors.category_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipe Lomba</Label>
        <select
          id="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          {...register('type')}
        >
          <option value="Individu">Individu</option>
          <option value="Kelompok">Kelompok</option>
        </select>
        {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
          <Label htmlFor="max_participants">Kuota Peserta</Label>
          <Input
            id="max_participants"
            type="number"
            {...register('max_participants')}
          />
          {errors.max_participants && <p className="text-red-500 text-xs">{errors.max_participants.message}</p>}
        </div>

      <div className="space-y-2">
        <Label htmlFor="schedule">Jadwal Pelaksanaan</Label>
        <input
          id="schedule"
          type="datetime-local"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register('schedule')}
        />
        {errors.schedule && <p className="text-red-500 text-xs">{errors.schedule.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi (Opsional)</Label>
        <Input
          id="location"
          placeholder="Misal: Lapangan Utama"
          {...register('location')}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan Tambahan (Misal: PIC Lomba)</Label>
        <Textarea
          id="notes"
          placeholder="Contoh: PIC: Budi (0812345678) - Wajib bawa alat sendiri"
          {...register('notes')}
          rows={2}
        />
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Lomba'}
        </Button>
      </div>
    </form>
  );
}
