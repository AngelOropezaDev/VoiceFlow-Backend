import { z } from 'zod';

export const updateTitleSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío'),
});

export type UpdateTitleDto = z.infer<typeof updateTitleSchema>;
