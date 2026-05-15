import { PlanType } from '@prisma/client';

export interface PlanLimits {
    maxMonthlySeconds: number;
    maxAudioDurationSeconds: number;
    canExportToNotion: boolean;
    canExportToCalendar: boolean;
    priority: number; // 1: Alta, 2: Media, 3: Baja
}

export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
    [PlanType.FREE]: {
        maxMonthlySeconds: 1800,       // 30 minutos
        maxAudioDurationSeconds: 180,  // 3 minutos por audio
        canExportToNotion: false,
        canExportToCalendar: false,
        priority: 3,
    },
    [PlanType.STARTER]: {
        maxMonthlySeconds: 9000,       // 150 minutos
        maxAudioDurationSeconds: 600,  // 10 minutos por audio
        canExportToNotion: true,
        canExportToCalendar: false,
        priority: 2,
    },
    [PlanType.PRO]: {
        maxMonthlySeconds: 30000,      // 500 minutos
        maxAudioDurationSeconds: 1800, // 30 minutos por audio
        canExportToNotion: true,
        canExportToCalendar: true,
        priority: 1,
    },
};