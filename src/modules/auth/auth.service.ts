import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async validateTelegramLogin(
    data: CreateUserDto,
  ): Promise<{ access_token: string }> {
    const telegram_bot_key = process.env.BOT_TOKEN;
    const { id } = data;

    if (!telegram_bot_key) {
      throw new Error('TELEGRAM_BOT_TOKEN is missing');
    }

    const { id: _, ...userObj } = data;
    delete userObj.auth_date;
    delete userObj.hash;

    const user = await this.prisma.user.upsert({
      where: { telegram_id: id.toString() },
      update: userObj,
      create: {
        ...userObj,
        telegram_id: id.toString(),
      },
    });

    const payload = { userId: user.id, telegramId: user.telegram_id };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }
}
