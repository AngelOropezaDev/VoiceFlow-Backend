import { Controller, Get, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRepository } from '../auth/auth.repository';
import { PLAN_CONFIGS } from '../common/configs/plans.config';

@Controller('users')
export class UsersController {
  constructor(private readonly authRepository: AuthRepository) {}

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: any) {
    const userId = req.user.id;
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const planConfig = PLAN_CONFIGS[user.plan];
    
    const minutesUsed = Math.floor(user.minutesUsed / 60);
    const maxMinutes = Math.floor(planConfig.maxMonthlySeconds / 60);
    const percentage = Math.min(100, Math.round((user.minutesUsed / planConfig.maxMonthlySeconds) * 100));

    return {
      planName: user.plan,
      minutesUsed,
      maxMinutes,
      percentage,
      isLimitReached: user.minutesUsed >= planConfig.maxMonthlySeconds,
    };
  }
}
