import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header with Bearer token is required',
      );
    }

    const token = authHeader.substring(7);

    try {
      const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException('JWT secret not configured');
      }

      const decoded = jwt.verify(token, secret, {
        clockTolerance: 5,
      }) as jwt.JwtPayload;

      // Validate role claim — only 'authenticated' users are allowed
      if (decoded.role !== 'authenticated') {
        throw new UnauthorizedException('Invalid token role');
      }

      // Validate sub claim exists and is a UUID
      if (!decoded.sub || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.sub)) {
        throw new UnauthorizedException('Invalid or missing user identity in token');
      }

      // Attach user ID (sub claim) to request
      request.user = decoded.sub;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
