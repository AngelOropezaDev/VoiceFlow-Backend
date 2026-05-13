import { Module } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AudioRepository } from './audio.repository';
import { AudioController } from './audio.controller';
import { S3Module } from 'src/s3/s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
  imports: [S3Module, PrismaModule, TranscriptionModule],
  controllers: [AudioController],
  providers: [AudioService, AudioRepository],
})
export class AudioModule { }
