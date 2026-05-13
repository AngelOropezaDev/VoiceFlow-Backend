import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Only validate the body, we don't want to validate query params/headers with this pipe unless specified
    if (metadata.type !== 'body') {
      return value;
    }
    
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error: any) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  }
}
