import { Module } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AudioRepository } from './audio.repository';
import { AudioController } from './audio.controller';
import { S3Module } from 'src/s3/s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionModule } from '../transcription/transcription.module';
import { AudioMetadataService } from './audio-metadata.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [S3Module, PrismaModule, TranscriptionModule, AuthModule],
  controllers: [AudioController],
  providers: [AudioService, AudioRepository, AudioMetadataService],
})
export class AudioModule { }
