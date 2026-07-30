import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(3, 'Nama event minimal 3 karakter').max(100, 'Nama event maksimal 100 karakter'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  location: z.string().min(3, 'Lokasi minimal 3 karakter').max(100),
  status: z.enum(['Draft', 'Upcoming', 'Ongoing', 'Finished']).optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;
