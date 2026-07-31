'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

const publicRegistrationSchema = z.object({
  competition_type: z.string().optional(),
  team_registration_mode: z.string().nullable().optional(),
  
  // Individual / Random Team Fields
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  
  // Existing Team Fields
  team_name: z.string().optional(),
  members: z.array(z.any()).optional()
}).superRefine((data, ctx) => {
  const isExistingTeam = data.competition_type === 'team' && data.team_registration_mode === 'existing';
  if (isExistingTeam) {
    if (!data.team_name || data.team_name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama tim minimal 2 karakter',
        path: ['team_name']
      });
    }
    if (!data.members || data.members.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal harus ada 2 anggota dalam satu tim',
        path: ['members', 'root']
      });
    }
    data.members?.forEach((member, index) => {
      if (!member.full_name || member.full_name.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama minimal 2 karakter', path: ['members', index, 'full_name'] });
      }
      if (!member.address || member.address.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Blok Rumah wajib diisi', path: ['members', index, 'address'] });
      }
    });
  } else {
    if (!data.full_name || data.full_name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama minimal 2 karakter',
        path: ['full_name']
      });
    }
    if (!data.address || data.address.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Blok Rumah / Alamat wajib diisi',
        path: ['address']
      });
    }
  }
});

type PublicRegistrationData = z.infer<typeof publicRegistrationSchema>;

interface PublicRegistrationDialogProps {
  competitionId: string;
  competitionTitle: string;
  competitionType?: string;
  teamRegistrationMode?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PublicRegistrationDialog({
  competitionId,
  competitionTitle,
  competitionType,
  teamRegistrationMode,
  isOpen,
  onClose,
  onSuccess,
}: PublicRegistrationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isExistingTeam = competitionType === 'team' && teamRegistrationMode === 'existing';

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PublicRegistrationData>({
    resolver: zodResolver(publicRegistrationSchema),
    defaultValues: {
      competition_type: competitionType,
      team_registration_mode: teamRegistrationMode,
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
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        competition_type: competitionType,
        team_registration_mode: teamRegistrationMode,
        full_name: '',
        phone: '',
        address: '',
        note: '',
        team_name: '',
        members: [{ full_name: '', address: '' }, { full_name: '', address: '' }]
      });
    }
  }, [isOpen, competitionType, teamRegistrationMode, reset]);

  const onSubmit = async (data: PublicRegistrationData) => {
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
          .eq('competition_id', competitionId)
          .limit(1)
          .single();

        if (existingTeam) {
          throw new Error(`Tim dengan nama "${formattedTeamName}" sudah terdaftar di lomba ini.`);
        }

        // 2. Insert Team
        const { data: tData, error: tError } = await supabase
          .from('teams')
          .insert([{ name: formattedTeamName, competition_id: competitionId }])
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
            .insert([{ competition_id: competitionId, participant_id: participantId, team_id: newTeamId }]);
            
          if (rError) throw rError;
        }

      } else {
        // --- INDIVIDUAL / RANDOM TEAM FLOW ---
        const formattedName = toTitleCase(data.full_name || '');
        const formattedAddress = toTitleCase(data.address || '');

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
            .insert([{ full_name: formattedName, phone: data.phone || null, address: formattedAddress, note: data.note || null }])
            .select('id')
            .single();

          if (pError) throw pError;
          participantId = pData.id;
        }

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
      }

      setIsSuccess(true);
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
      <DialogContent className="sm:max-w-[425px] md:max-w-[550px] p-0 overflow-hidden bg-surface rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 shrink-0 border-b">
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

        <div className="p-6 overflow-y-auto">
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

                    <div className="space-y-3">
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
                    <Label htmlFor="full_name">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input
                      id="full_name"
                      placeholder="Misal: Andi Saputra"
                      {...register('full_name')}
                    />
                    {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Blok Rumah / Alamat <span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      placeholder="Misal: Blok A No. 12 / RT 04"
                      {...register('address')}
                    />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
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
                    <Label htmlFor="note">Catatan (Opsional)</Label>
                    <Input
                      id="note"
                      placeholder="Misal: Bawa alat sendiri"
                      {...register('note')}
                    />
                    {errors.note && <p className="text-red-500 text-xs">{errors.note.message}</p>}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 pb-2">
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
