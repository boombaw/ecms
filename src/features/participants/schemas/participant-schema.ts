import { z } from 'zod';

export const participantSchema = z.object({
  competition_id: z.string().min(1, 'Lomba wajib dipilih'),
  is_existing_team: z.boolean().optional(),
  
  // Individual / Edit fields
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  
  // Existing team fields
  team_name: z.string().optional(),
  members: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.is_existing_team) {
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
        message: 'Nama peserta minimal 2 karakter',
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

export type ParticipantFormData = z.infer<typeof participantSchema>;
