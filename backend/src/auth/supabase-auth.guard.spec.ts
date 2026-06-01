import * as fc from 'fast-check';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('SupabaseAuthGuard property tests', () => {
  let guard: SupabaseAuthGuard;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as any;
    guard = new SupabaseAuthGuard(configService);
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    const request: any = {
      headers: authHeader ? { authorization: authHeader } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  /**
   * Property 8: JWT sub claim extraction produces correct user identity
   * Validates: Requirements 6.3
   */
  describe('Property 8: JWT sub claim extraction produces correct user identity', () => {
    it('for any UUID sub claim, the guard extracts and attaches that exact UUID', () => {
      fc.assert(
        fc.property(fc.uuid(), (userId) => {
          // Mock jwt.verify to return a payload with the generated UUID
          (jwt.verify as jest.Mock).mockReturnValue({
            sub: userId,
            role: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 3600,
          });

          const context = createMockContext(`Bearer valid-token-${userId}`);
          const result = guard.canActivate(context);

          expect(result).toBe(true);

          // Verify the extracted user ID matches the sub claim
          const request = context.switchToHttp().getRequest() as any;
          return request.user === userId;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Guard rejects invalid tokens', () => {
    it('throws UnauthorizedException when no auth header', () => {
      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when role is not authenticated', () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        role: 'anon',
      });
      const context = createMockContext('Bearer some-token');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when jwt.verify throws', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid signature');
      });
      const context = createMockContext('Bearer invalid-token');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
