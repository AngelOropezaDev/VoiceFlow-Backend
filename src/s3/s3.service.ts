import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    private s3Client: S3Client
    private readonly bucketName: string
    private readonly uploadTime: number

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME')
        this.uploadTime = this.configService.getOrThrow<number>('R2_UPLOAD_TIME')

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: this.configService.getOrThrow<string>('R2_ENDPOINT'),
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY')
            }
        })
    }

    async generatePreSignedUrl(fileKey: string) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            ContentType: 'audio/webm'
        })

        return getSignedUrl(this.s3Client, command, { expiresIn: this.uploadTime })
    }

    async getFileAsBuffer(fileKey: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey
        });

        const response = await this.s3Client.send(command);
        const stream = response.Body as import('stream').Readable;
        
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
