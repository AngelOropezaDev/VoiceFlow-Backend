import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class TranscriptionService {
    private readonly logger = new Logger(TranscriptionService.name);
    private genAI: GoogleGenerativeAI;

    constructor(
        private configService: ConfigService,
        private s3Service: S3Service
    ) {
        this.genAI = new GoogleGenerativeAI(this.configService.getOrThrow<string>('GEMINI_API_KEY'));
    }

    async transcribe(audioKey: string): Promise<string> {
        try {
            const audioBuffer = await this.s3Service.getFileAsBuffer(audioKey);

            const model = this.genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

            const prompt = 'Extract only the speech-to-text transcription from this audio. Do not add any conversational filler, explanations, or introductory remarks. Just the spoken words.';

            const ext = audioKey.split('.').pop()?.toLowerCase() || 'webm';
            const mimeType = ext === 'mp3' ? 'audio/mpeg' :
                ext === 'wav' ? 'audio/wav' :
                    ext === 'm4a' ? 'audio/m4a' : 'audio/webm';

            const filePart = {
                inlineData: {
                    data: audioBuffer.toString("base64"),
                    mimeType
                }
            };

            const result = await model.generateContent([prompt, filePart]);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.logger.error(`Error transcribing audio ${audioKey}: ${error.message}`);
            throw error;
        }
    }
}
