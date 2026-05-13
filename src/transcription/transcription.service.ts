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
            return this.transcribeWithBuffer(audioBuffer, audioKey);
        } catch (error: any) {
            this.logger.error(`Error transcribing audio ${audioKey}: ${error.message}`);
            throw error;
        }
    }

    async transcribeWithBuffer(audioBuffer: Buffer, audioKey: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
            this.logger.error(`Error transcribing audio with buffer: ${error.message}`);
            throw error;
        }
    }

    async analyzeTranscription(text: string) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const prompt = `Analiza la transcripción proporcionada. Genera un resumen de una sola frase, identifica una lista de tareas concretas (action items) y redacta un borrador de correo electrónico. Si la nota es una reunión o acuerdo, el correo debe ser de seguimiento; si es personal, debe ser un recordatorio estructurado para uno mismo.

Transcripción: "${text}"

Formato de salida (JSON):
{
  "summary": "string",
  "actionItems": ["string"],
  "draftEmail": "string"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = JSON.parse(response.text());

            return content as { summary: string; actionItems: string[]; draftEmail: string };
        } catch (error: any) {
            this.logger.error(`Error analyzing transcription: ${error.message}`);
            throw error;
        }
    }
}
