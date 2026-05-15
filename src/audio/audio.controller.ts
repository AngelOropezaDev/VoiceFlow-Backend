import { Body, Controller, Post, Req, UseGuards, UsePipes, Param, Patch, Get, UseInterceptors, UploadedFile, Res, ForbiddenException, NotFoundException, StreamableFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { AudioService } from './audio.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { uploadAudioSchema } from './dto/audio.schema';
import type { UploadAudioDto } from './dto/audio.schema';
import { S3Service } from 'src/s3/s3.service';
import * as updateTasksDto from './dto/update-tasks.dto';
import { QuotaGuard } from './guards/quota.guard';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService, private readonly s3Service: S3Service) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 9;
    return this.audioService.listByUserId(req.user.id, pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDetail(@Param('id') id: string, @Req() req: any) {
    const audio = await this.audioService.findById(id);
    if (!audio) {
      throw new NotFoundException("El audio no existe");
    }
    if (req.user.id !== audio.userId) {
      throw new ForbiddenException('No tienes permiso para acceder a este audio');
    }
    return audio;
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, QuotaGuard)
  @UsePipes(new ZodValidationPipe(uploadAudioSchema))
  async getUploadUrl(@Body() body: UploadAudioDto, @Req() req: any) {
    const userId = req.user.id;

    return this.audioService.initUpload(userId, body.fileName);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, QuotaGuard)
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
  @UseGuards(JwtAuthGuard, QuotaGuard)
  async processAudio(@Param('id') id: string) {
    return this.audioService.processAudio(id);
  }

  @Get(':id/stream')
  @UseGuards(JwtAuthGuard)
  async streamAudio(@Param('id') id: string, @Res() res: express.Response, @Req() req: any) {
    const userId = req.user.id

    const audio = await this.audioService.findById(id)

    if (!audio) {
      throw new NotFoundException("El audio no existe")
    }


    if (userId !== audio?.userId) {
      throw new ForbiddenException('No tienes permiso para acceder a este audio')
    }

    const rangeHeader = req.headers.range;

    try {
      const { stream, contentLength, contentRange } = await this.s3Service.readStream(audio.storageKey, rangeHeader);

      const statusCode = rangeHeader ? 206 : 200;

      const headers: any = {
        'Content-Type': 'audio/webm',
        'Content-Disposition': `inline; filename="${audio.fileName}"`,
        'Accept-Ranges': 'bytes',
      };

      if (contentLength) headers['Content-Length'] = contentLength;
      if (contentRange) headers['Content-Range'] = contentRange;

      res.writeHead(statusCode, headers);

      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Streaming error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

    } catch (error) {
      console.error('S3 error:', error);
      throw new NotFoundException('No se pudo encontrar el archivo en el storage');
    }
  }

  @Patch(':id/tasks')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateTasksDto.updateTasksSchema))
  async updateTask(@Param("id") id: string, @Req() req: any, @Body() data: updateTasksDto.UpdateTasksDto) {
    const userId = req.user.id
    return this.audioService.updateTask(id, userId, data.tasks)
  }

  @Patch(':id/title')
  @UseGuards(JwtAuthGuard)
  async updateTitle(@Param("id") id: string, @Req() req: any, @Body('title') title: string) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ForbiddenException('El título no puede estar vacío');
    }
    const userId = req.user.id;
    return this.audioService.updateTitle(id, userId, title);
  }
}
