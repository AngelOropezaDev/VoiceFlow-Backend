import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, AudioStatus } from "@prisma/client";

@Injectable()
export class AudioRepository {
    constructor(private prisma: PrismaService) { }

    async newAudio(data: Prisma.AudioUncheckedCreateInput) {
        await this.prisma.audio.create({ data })
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

    async updateTranscriptionAndStatus(id: string, transcription: string) {
        return this.prisma.audio.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                aiContent: {
                    upsert: {
                        create: {
                            transcription,
                            summary: '',
                            actionItems: {},
                            draftEmail: ''
                        },
                        update: {
                            transcription
                        }
                    }
                }
            }
        });
    }
}