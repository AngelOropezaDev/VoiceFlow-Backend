import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { AudioModule } from './audio/audio.module';
import { AuthModule } from './auth/auth.module';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [PrismaModule, S3Module, AudioModule, AuthModule, TranscriptionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
