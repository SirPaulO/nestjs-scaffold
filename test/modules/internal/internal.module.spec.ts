import { InternalModule } from '@modules/internal/internal.module';
import { InternalController } from '@modules/internal/internal.controller';
import { ApiKeyGuard } from '@common/guards';

describe('InternalModule', () => {
  it('should be defined', () => {
    expect(InternalModule).toBeDefined();
  });

  it('should register InternalController and ApiKeyGuard', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      InternalModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      InternalModule,
    ) as unknown[];

    expect(controllers).toContain(InternalController);
    expect(providers).toContain(ApiKeyGuard);
  });
});
