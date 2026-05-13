import { Body, Controller, Post, Req, UseGuards, UsePipes, Param, Patch, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AudioService } from './audio.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { uploadAudioSchema } from './dto/audio.schema';
import type { UploadAudioDto } from './dto/audio.schema';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any) {
    return this.audioService.listByUserId(req.user.id);
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(uploadAudioSchema))
  async getUploadUrl(@Body() body: UploadAudioDto, @Req() req: any) {
    const userId = req.user.id;

    return this.audioService.initUpload(userId, body.fileName);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: any, @Req() req: any, @Body('duration') duration?: string) {
    if (!file) {
      throw new Error('Archivo de audio no recibido');
    }
    const userId = req.user.id;
    const parsedDuration = duration ? parseFloat(duration) : undefined;
    return this.audioService.uploadDirect(userId, file, parsedDuration);
  }

  @Patch(':id/process')
  @UseGuards(JwtAuthGuard)
  async processAudio(@Param('id') id: string) {
    // No bloqueamos la respuesta del controlador, lo lanzamos en "background" 
    // o lo esperamos según prefieras para el MVP
    return this.audioService.processAudio(id);
  }
}
