import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, AudioStatus } from "@prisma/client";

@Injectable()
export class AudioRepository {
    constructor(private prisma: PrismaService) { }

    async newAudio(data: Prisma.AudioUncheckedCreateInput) {
        return this.prisma.audio.create({ data });
    }

    async findAllByUserId(userId: string) {
        return this.prisma.audio.findMany({
            where: { userId },
            include: { aiContent: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string) {
        return this.prisma.audio.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: AudioStatus) {
        return this.prisma.audio.update({
            where: { id },
            data: { status }
        });
    }

    async updateDuration(id: string, duration: number) {
        return this.prisma.audio.update({
            where: { id },
            data: { duration }
        });
    }

    async updateTranscriptionAndStatus(id: string, transcription: string, analysis?: { summary: string, actionItems: string[], draftEmail: string }, duration?: number) {
        return this.prisma.audio.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                duration: duration,
                aiContent: {
                    upsert: {
                        create: {
                            transcription,
                            summary: analysis?.summary || '',
                            actionItems: analysis?.actionItems || [],
                            draftEmail: analysis?.draftEmail || ''
                        },
                        update: {
                            transcription,
                            summary: analysis?.summary || '',
                            actionItems: analysis?.actionItems || [],
                            draftEmail: analysis?.draftEmail || ''
                        }
                    }
                }
            }
        });
    }
}