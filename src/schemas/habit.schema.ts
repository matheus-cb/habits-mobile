import { z } from 'zod';

export const habitSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

export type HabitFormData = z.infer<typeof habitSchema>;
