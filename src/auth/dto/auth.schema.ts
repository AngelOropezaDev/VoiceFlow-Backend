import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Debes ingresar un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Debes ingresar un correo válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;