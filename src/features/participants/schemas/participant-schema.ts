import { z } from 'zod';

export const participantSchema = z.object({
  competition_id: z.string().min(1, 'Lomba wajib dipilih'),
  full_name: z.string().min(2, 'Nama peserta minimal 2 karakter').max(100),
  phone: z.string().optional(),
  address: z.string().min(1, 'Blok Rumah / Alamat wajib diisi'),
  note: z.string().optional(),
});

export type ParticipantFormData = z.infer<typeof participantSchema>;
