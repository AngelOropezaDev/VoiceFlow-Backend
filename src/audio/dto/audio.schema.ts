import { z } from 'zod';

export const uploadAudioSchema = z.object({
  fileName: z.string().min(1, 'El nombre del archivo es requerido'),
});

export type UploadAudioDto = z.infer<typeof uploadAudioSchema>;
