import { z } from 'zod';

export const actionItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'El texto de la tarea no puede estar vacío'),
  completed: z.boolean(),
});

export const updateTasksSchema = z.object({
  tasks: z.array(actionItemSchema),
});

export type UpdateTasksDto = z.infer<typeof updateTasksSchema>;
