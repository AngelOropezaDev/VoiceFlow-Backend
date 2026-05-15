import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PLAN_CONFIGS } from 'src/common/configs/plans.config';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        minutesUsed: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const now = new Date();
    const lastReset = new Date(user.lastResetDate);

    // Lazy Reset Logic: Detect if a new month has started
    const isNewMonth =
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    let usageInSeconds = user.minutesUsed;

    if (isNewMonth) {
      // Perform the reset in the database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          minutesUsed: 0,
          lastResetDate: now,
        },
      });
      // Update the local variable to allow the request to proceed
      usageInSeconds = 0;
    }

    const config = PLAN_CONFIGS[user.plan];
    const limitInSeconds = config.maxMonthlySeconds;

    if (usageInSeconds >= limitInSeconds) {
      throw new ForbiddenException({
        error: 'Quota Exceeded',
        message: `Has superado el límite mensual de tu plan ${user.plan}.`,
        details: {
          currentPlan: user.plan,
          limitMinutes: Math.floor(limitInSeconds / 60),
          usedMinutes: Math.floor(usageInSeconds / 60),
          usedSeconds: usageInSeconds,
        },
      });
    }

    return true;
  }
}
