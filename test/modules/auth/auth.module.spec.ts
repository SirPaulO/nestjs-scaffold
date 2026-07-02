import { AuthModule } from '@modules/auth/auth.module';
import { JwtStrategy } from '@modules/auth/strategies';

describe('AuthModule', () => {
  it('should be defined', () => {
    expect(AuthModule).toBeDefined();
  });

  it('should register the JWT strategy', () => {
    const providers = Reflect.getMetadata(
      'providers',
      AuthModule,
    ) as unknown[];

    expect(providers).toContain(JwtStrategy);
  });
});
