import { Injectable, Logger } from '@nestjs/common';
import { parseBuffer } from 'music-metadata';

@Injectable()
export class AudioMetadataService {
    private readonly logger = new Logger(AudioMetadataService.name);

    async getDuration(buffer: Buffer, mimeType?: string): Promise<number | null> {
        try {
            const metadata = await parseBuffer(buffer, { mimeType });
            return metadata.format.duration || null;
        } catch (error) {
            this.logger.error(`Error parsing audio metadata: ${error.message}`);
            return null;
        }
    }
}
