import { z } from 'zod';

export const competitionSchema = z.object({
  event_id: z.string().min(1, 'Event wajib dipilih'),
  category_id: z.array(z.string()).min(1, 'Minimal pilih 1 kategori'),
  title: z.string().min(3, 'Nama lomba minimal 3 karakter').max(100),
  type: z.string().min(1, 'Tipe lomba wajib diisi'),
  schedule: z.string().min(1, 'Jadwal wajib diisi'),
  location: z.string().optional(),
  max_participants: z.coerce.number().min(1, 'Kuota minimal 1').optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export type CompetitionFormData = z.infer<typeof competitionSchema>;
