import { CacheModule } from '@modules/cache/cache.module';
import { CacheService } from '@modules/cache/cache.service';

describe('CacheModule', () => {
  it('should be defined', () => {
    expect(CacheModule).toBeDefined();
  });

  it('should export CacheService for use across the app', () => {
    const exportsMeta = Reflect.getMetadata(
      'exports',
      CacheModule,
    ) as unknown[];

    expect(exportsMeta).toContain(CacheService);
  });
});
