import { Module } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { S3Module } from '../s3/s3.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [S3Module, ConfigModule],
  providers: [TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
