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
            const model = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

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
                model: "gemini-3.1-flash-lite",
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const prompt = `Analiza: "${text}".
Responde JSON:
{
  "title": "Título max 6 palabras",
  "summary": "Resumen en una frase",
  "actionItems": [{
    "text": "descripción", 
    "priority": "Alta|Media|Baja"
  }],
  "draftEmail": "Borrador de seguimiento"
}

Criterios de prioridad (SÉ MUY ESTRICTO):
- Alta: Acciones críticas, compromisos con fechas (hoy/mañana), o bloqueadores de proyecto.
- Media: Seguimientos importantes, tareas con fechas próximas (esta semana).
- Baja: Tareas rutinarias, registros de actividad, actualizaciones de estado, recordatorios menores o planes futuros sin fecha. (Por defecto, si no hay urgencia clara, usa Baja).`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = JSON.parse(response.text());

            return content as { 
                title: string; 
                summary: string; 
                actionItems: { text: string; priority: 'Alta' | 'Media' | 'Baja' }[]; 
                draftEmail: string 
            };
        } catch (error: any) {
            this.logger.error(`Error analyzing transcription: ${error.message}`);
            throw error;
        }
    }
}
