/**
 * Interfaz compartida para los Action Items (Tareas)
 */
export interface IActionItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Payload para el endpoint PATCH /api/audio/:id/tasks
 */
export type UpdateActionItemsPayload = IActionItem[];
