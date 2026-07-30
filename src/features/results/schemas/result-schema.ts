import { z } from 'zod';

export const resultSchema = z.object({
  competition_id: z.string().min(1, 'Lomba wajib dipilih'),
  rank_1_participant_id: z.string().min(1, 'Juara 1 wajib dipilih'),
  rank_2_participant_id: z.string().optional(),
  rank_3_participant_id: z.string().optional(),
});

export type ResultFormData = z.infer<typeof resultSchema>;
