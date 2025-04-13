import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './auth.dto';
import { AuthGuard } from './auth.guard';

@ApiBearerAuth('access_token')
@ApiTags('Clones Settings')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('/login')
  async loginOrRegister(@Body() data: CreateUserDto) {
    const result = await this.authService.validateTelegramLogin(data);
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Req() req) {
    return this.authService.getMe(req.user.userId);
  }

}
