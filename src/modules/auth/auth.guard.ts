import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const { authorization } = request.headers;

      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide token');
      }

      const authToken = authorization.replace(/Bearer\s+/i, '').trim();

      const decoded = await this.jwtService.verifyAsync(authToken, {
        secret: process.env.TOKEN_SECRET_KEY, 
      });

      request.user = decoded;  

      return true;
    } catch (error) {
      console.log('Auth error -', error.message);
      throw new ForbiddenException(
        error.message || 'Session expired! Please sign In',
      );
    }
  }
}
