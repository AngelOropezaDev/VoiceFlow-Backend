import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { v4 as uuidv4 } from 'uuid'
import { AudioRepository } from './audio.repository';
import { TranscriptionService } from '../transcription/transcription.service';
import { AudioMetadataService } from './audio-metadata.service';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);

    constructor(
        private s3Service: S3Service,
        private audioRepo: AudioRepository,
        private transcriptionService: TranscriptionService,
        private audioMetadataService: AudioMetadataService
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

        const audio = await this.audioRepo.newAudio(data)

        return {
            id: audio.id,
            uploadUrl: newUrl,
            storageKey: fileKey
        };
    }

    async listByUserId(userId: string, page: number = 1, limit: number = 9) {
        return this.audioRepo.findAllByUserId(userId, page, limit);
    }

    async uploadDirect(userId: string, file: any, duration?: number) {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'webm';
        const fileKey = `users/${userId}/audios/${uuidv4()}.${fileExtension}`;

        // Upload to R2 from backend
        await this.s3Service.uploadFile(fileKey, file.buffer, file.mimetype);

        const data = {
            userId: userId,
            storageKey: fileKey,
            fileName: file.originalname || `voice_note_${Date.now()}.webm`,
            duration: duration
        }

        const audio = await this.audioRepo.newAudio(data);

        return {
            id: audio.id,
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

            const audioBuffer = await this.s3Service.getFileAsBuffer(audio.storageKey);

            // Get duration and update
            const ext = audio.storageKey.split('.').pop()?.toLowerCase() || 'webm';
            const mimeType = ext === 'mp3' ? 'audio/mpeg' :
                ext === 'wav' ? 'audio/wav' :
                    ext === 'm4a' ? 'audio/m4a' : 'audio/webm';

            const duration = await this.audioMetadataService.getDuration(audioBuffer, mimeType);

            const transcription = await this.transcriptionService.transcribeWithBuffer(audioBuffer, audio.storageKey);

            // Analyze transcription
            const analysis = await this.transcriptionService.analyzeTranscription(transcription);

            await this.audioRepo.updateTranscriptionAndStatus(audioId, transcription, analysis, duration ?? undefined);
            return { success: true, transcription, duration, analysis };
        } catch (error: any) {
            this.logger.error(`Failed to process audio ${audioId}: ${error.message}`);
            await this.audioRepo.updateStatus(audioId, 'FAILED');
            throw error;
        }
    }

    async findById(id: string) {
        return await this.audioRepo.findByIdDetailed(id)
    }

}
