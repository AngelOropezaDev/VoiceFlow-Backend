import { Body, Controller, Post, Req, UseGuards, UsePipes, Param, Patch } from '@nestjs/common';
import { AudioService } from './audio.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { uploadAudioSchema } from './dto/audio.schema';
import type { UploadAudioDto } from './dto/audio.schema';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) { }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(uploadAudioSchema))
  async getUploadUrl(@Body() body: UploadAudioDto, @Req() req: any) {
    const userId = req.user.id;

    return this.audioService.initUpload(userId, body.fileName);
  }

  @Patch(':id/process')
  @UseGuards(JwtAuthGuard)
  async processAudio(@Param('id') id: string) {
    // No bloqueamos la respuesta del controlador, lo lanzamos en "background" 
    // o lo esperamos según prefieras para el MVP
    return this.audioService.processAudio(id);
  }
}
