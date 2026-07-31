import { z } from 'zod';

export const competitionSchema = z.object({
  event_id: z.string().min(1, 'Event wajib dipilih'),
  category_id: z.array(z.string()).min(1, 'Minimal pilih 1 kategori'),
  title: z.string().min(3, 'Nama lomba minimal 3 karakter').max(100),
  competition_type: z.enum(['individual', 'team'], { required_error: 'Tipe lomba wajib diisi' }),
  team_registration_mode: z.enum(['existing', 'random']).nullable().optional(),
  schedule: z.string().min(1, 'Jadwal wajib diisi'),
  location: z.string().optional(),
  max_participants: z.coerce.number().min(1, 'Kuota minimal 1').optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.competition_type === 'team' && !data.team_registration_mode) {
    return false;
  }
  return true;
}, {
  message: 'Mode pendaftaran tim wajib diisi untuk lomba beregu',
  path: ['team_registration_mode']
});

export type CompetitionFormData = z.infer<typeof competitionSchema>;
