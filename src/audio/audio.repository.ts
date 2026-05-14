import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, AudioStatus } from "@prisma/client";

@Injectable()
export class AudioRepository {
    constructor(private prisma: PrismaService) { }

    async newAudio(data: Prisma.AudioUncheckedCreateInput) {
        return this.prisma.audio.create({ data });
    }

    async findAllByUserId(userId: string, page: number = 1, limit: number = 9) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.audio.findMany({
                where: { userId },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    duration: true,
                    status: true,
                    createdAt: true,
                    aiContent: {
                        select: {
                            summary: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.audio.count({ where: { userId } })
        ]);

        return {
            data: data.map(audio => ({
                ...audio,
                summary: audio.aiContent?.summary || ''
            })),
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit)
            }
        };
    }

    async findById(id: string) {
        return this.prisma.audio.findUnique({ where: { id } });
    }

    async findByIdDetailed(id: string) {
        return this.prisma.audio.findUnique({
            where: { id },
            include: { aiContent: true }
        });
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

    async updateTranscriptionAndStatus(id: string, transcription: string, analysis?: { title?: string, summary: string, actionItems: string[], draftEmail: string }, duration?: number) {
        return this.prisma.audio.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                duration: duration,
                title: analysis?.title || undefined,
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