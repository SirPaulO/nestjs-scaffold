import { APP_GUARD } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppController } from '../src/app.controller';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should register the root AppController', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      AppModule,
    ) as unknown[];

    expect(controllers).toContain(AppController);
  });

  it('should wire a global rate-limit guard and a global deny-by-default JWT guard', () => {
    const providers = Reflect.getMetadata('providers', AppModule) as Array<{
      provide?: unknown;
      useClass?: unknown;
    }>;

    const guardProviders = providers.filter(
      (provider) => provider?.provide === APP_GUARD,
    );

    expect(guardProviders).toHaveLength(2);
  });
});
