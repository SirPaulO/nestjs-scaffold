import { BaseEntity } from '@database/entities/base.entity';

class TestEntity extends BaseEntity {}

describe('BaseEntity', () => {
  it('should expose id, createdAt, updatedAt and an optional deletedAt', () => {
    const entity = new TestEntity();
    entity.id = 'a3f1c2d4-0000-4000-8000-000000000000';
    entity.createdAt = new Date('2026-01-01T00:00:00Z');
    entity.updatedAt = new Date('2026-01-02T00:00:00Z');

    expect(entity.id).toBe('a3f1c2d4-0000-4000-8000-000000000000');
    expect(entity.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(entity.updatedAt).toEqual(new Date('2026-01-02T00:00:00Z'));
    expect(entity.deletedAt).toBeUndefined();
  });

  it('should support soft-delete via deletedAt', () => {
    const entity = new TestEntity();
    entity.deletedAt = new Date('2026-02-01T00:00:00Z');

    expect(entity.deletedAt).toEqual(new Date('2026-02-01T00:00:00Z'));
  });
});
