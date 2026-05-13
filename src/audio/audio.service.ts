import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { v4 as uuidv4 } from 'uuid'
import { AudioRepository } from './audio.repository';
import { TranscriptionService } from '../transcription/transcription.service';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);

    constructor(
        private s3Service: S3Service, 
        private audioRepo: AudioRepository,
        private transcriptionService: TranscriptionService
    ) { }

    async initUpload(userId: string, fileName: string) {
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'webm';

        const fileKey = `users/${userId}/audios/${uuidv4()}.${fileExtension}`;

        const newUrl = await this.s3Service.generatePreSignedUrl(fileKey)

        const data = {
            userId: userId,
            storageKey: fileKey,
            fileName: fileName
        }

        await this.audioRepo.newAudio(data)

        return {
            uploadUrl: newUrl,
            storageKey: fileKey
        };
    }

    async processAudio(audioId: string) {
        const audio = await this.audioRepo.findById(audioId);
        if (!audio) {
            throw new NotFoundException(`Audio with ID ${audioId} not found`);
        }

        try {
            await this.audioRepo.updateStatus(audioId, 'PROCESSING');
            const transcription = await this.transcriptionService.transcribe(audio.storageKey);
            await this.audioRepo.updateTranscriptionAndStatus(audioId, transcription);
            return { success: true, transcription };
        } catch (error: any) {
            this.logger.error(`Failed to process audio ${audioId}: ${error.message}`);
            await this.audioRepo.updateStatus(audioId, 'FAILED');
            throw error;
        }
    }
}
