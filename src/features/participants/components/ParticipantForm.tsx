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
import { useWatch, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Search, ChevronDown, Check } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface ParticipantFormProps {
  initialData?: ParticipantFormData & { id?: string; registration_id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ParticipantForm({ initialData, onSuccess, onCancel }: ParticipantFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Dropdown State
  const [searchComp, setSearchComp] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: competitions } = useQuery({
    queryKey: ['competitions-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('competitions').select('id, title, category_id, competition_type, team_registration_mode').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: initialData || {
      competition_id: '',
      is_existing_team: false,
      full_name: '',
      phone: '',
      address: '',
      note: '',
      team_name: '',
      members: [{ full_name: '', address: '' }, { full_name: '', address: '' }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members'
  } as any);

  const selectedCompId = useWatch({
    control,
    name: 'competition_id'
  });

  // Calculate if the selected competition is an "Existing Team" competition
  const isExistingTeam = Boolean(
    !initialData?.id && // If we are editing an existing participant, we stick to the individual form
    competitions?.find(c => {
      if (c.id !== selectedCompId) return false;
      const compType = c.competition_type?.trim().toLowerCase();
      const mode = c.team_registration_mode?.trim().toLowerCase();
      return (compType === 'team' || compType === 'kelompok') && mode === 'existing';
    })
  );

  // Sync the hidden field so validation knows which rules to apply
  if (control._formValues.is_existing_team !== isExistingTeam) {
    setValue('is_existing_team', isExistingTeam);
  }

  const onSubmit = async (data: ParticipantFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isExistingTeam) {
        // --- EXISTING TEAM FLOW ---
        const formattedTeamName = toTitleCase(data.team_name || '');
        
        // 1. Check if team already exists in this competition
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .ilike('name', formattedTeamName)
          .eq('competition_id', data.competition_id)
          .limit(1)
          .single();

        if (existingTeam) {
          throw new Error(`Tim dengan nama "${formattedTeamName}" sudah terdaftar di lomba ini.`);
        }

        // 2. Insert Team
        const { data: tData, error: tError } = await supabase
          .from('teams')
          .insert([{ name: formattedTeamName, competition_id: data.competition_id }])
          .select('id')
          .single();

        if (tError) throw tError;
        const newTeamId = tData.id;

        // 3. Process members
        for (const member of data.members || []) {
          const formattedName = toTitleCase(member.full_name);
          const formattedAddress = toTitleCase(member.address);

          // Find or create participant
          const { data: existingParticipant } = await supabase
            .from('participants')
            .select('id')
            .ilike('full_name', formattedName)
            .eq('address', formattedAddress)
            .limit(1)
            .single();

          let participantId = existingParticipant?.id;

          if (!participantId) {
            const { data: pData, error: pError } = await supabase
              .from('participants')
              .insert([{ full_name: formattedName, address: formattedAddress }])
              .select('id')
              .single();

            if (pError) throw pError;
            participantId = pData.id;
          }

          // Insert Registration for this member with team_id
          const { error: rError } = await supabase
            .from('registrations')
            .insert([{ competition_id: data.competition_id, participant_id: participantId, team_id: newTeamId }]);
            
          if (rError) throw rError;
        }
      } else {
        // --- INDIVIDUAL / RANDOM TEAM / EDIT FLOW ---
        let participantId = initialData?.id;

        if (!initialData?.id) {
          const formattedName = toTitleCase(data.full_name || '');
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
          const formattedName = toTitleCase(data.full_name || '');
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
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center justify-between h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="truncate">
              {(() => {
                if (!selectedCompId) return 'Pilih Lomba...';
                const c = competitions?.find(comp => comp.id === selectedCompId);
                if (!c) return 'Pilih Lomba...';
                const isTeam = c.competition_type?.toLowerCase() === 'team' || c.competition_type?.toLowerCase() === 'kelompok';
                const modeLabel = isTeam ? (c.team_registration_mode === 'existing' ? ' (Tim Sendiri)' : ' (Tim Acak)') : '';
                return `${c.title} ${c.category_id ? `(${c.category_id})` : ''}${modeLabel}`;
              })()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <div className="flex items-center px-3 py-2 border-b">
                <Search className="w-4 h-4 mr-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari lomba..."
                  className="flex-1 w-full text-sm outline-none bg-transparent"
                  value={searchComp}
                  onChange={(e) => setSearchComp(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {competitions
                  ?.filter(c => 
                    c.title.toLowerCase().includes(searchComp.toLowerCase()) || 
                    c.category_id?.toLowerCase().includes(searchComp.toLowerCase())
                  )
                  .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                    onClick={() => {
                      setValue('competition_id', c.id, { shouldValidate: true });
                      setIsDropdownOpen(false);
                      setSearchComp('');
                    }}
                  >
                    <span>
                      {c.title} {c.category_id ? `(${c.category_id})` : ''}
                      {(c.competition_type?.toLowerCase() === 'team' || c.competition_type?.toLowerCase() === 'kelompok') && (
                        <span className="text-slate-500 ml-1">
                          - {c.team_registration_mode === 'existing' ? 'Tim Sendiri' : 'Tim Acak'}
                        </span>
                      )}
                    </span>
                    {selectedCompId === c.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
                {competitions?.filter(c => 
                    c.title.toLowerCase().includes(searchComp.toLowerCase()) || 
                    c.category_id?.toLowerCase().includes(searchComp.toLowerCase())
                  ).length === 0 && (
                  <div className="px-3 py-4 text-sm text-center text-slate-500">
                    Lomba tidak ditemukan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Hidden select to register with React Hook Form */}
        <select
          className="hidden"
          {...register('competition_id')}
        >
          <option value="">Pilih Lomba...</option>
          {competitions?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {errors.competition_id && <p className="text-red-500 text-xs">{errors.competition_id.message}</p>}
      </div>

      {isExistingTeam ? (
        // --- EXISTING TEAM FORM ---
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="team_name">Nama Tim <span className="text-red-500">*</span></Label>
            <Input
              id="team_name"
              placeholder="Misal: Tim Garuda"
              {...register('team_name')}
            />
            {errors.team_name && <p className="text-red-500 text-xs">{errors.team_name.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Daftar Anggota</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ full_name: '', address: '' })}
                className="h-8 rounded-lg text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Tambah
              </Button>
            </div>
            {errors.members?.root && <p className="text-red-500 text-xs">{errors.members.root.message}</p>}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 bg-slate-50 border rounded-xl relative group">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Nama Anggota {index + 1} <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Nama Lengkap"
                        {...register(`members.${index}.full_name` as const)}
                        className="h-9"
                      />
                      {(errors.members as any)?.[index]?.full_name && <p className="text-red-500 text-xs">{(errors.members as any)[index]?.full_name?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Blok Rumah / RT <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Misal: Blok A / RT 01"
                        {...register(`members.${index}.address` as const)}
                        className="h-9"
                      />
                      {(errors.members as any)?.[index]?.address && <p className="text-red-500 text-xs">{(errors.members as any)[index]?.address?.message}</p>}
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-slate-400 hover:text-red-500 h-8 w-8 mt-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // --- INDIVIDUAL / RANDOM TEAM FORM ---
        <>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Peserta</Label>
            <Input
              id="full_name"
              placeholder="Nama Lengkap"
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
        </>
      )}

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
