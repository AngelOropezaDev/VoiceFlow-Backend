import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        // En versiones modernas de Prisma ya no es necesario llamar explícitamente a $connect()
        // porque se conecta automáticamente ("lazy loading").
    }
}
