import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  async increaseUsedMinutes(userId: string, seconds: number) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          minutesUsed: {
            increment: seconds,
          },
        },
      });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}
