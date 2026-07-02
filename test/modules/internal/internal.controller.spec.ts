import { Reflector } from '@nestjs/core';
import { InternalController } from '@modules/internal/internal.controller';
import { IS_PUBLIC_KEY } from '@common/decorators';

describe('InternalController', () => {
  let controller: InternalController;

  beforeEach(() => {
    controller = new InternalController();
  });

  describe('health', () => {
    it('should return an ok status', () => {
      expect(controller.health()).toEqual({ status: 'ok' });
    });
  });

  it('should be marked @Public() to opt out of the global JWT guard (it authenticates via X-Api-Key instead)', () => {
    const reflector = new Reflector();
    expect(reflector.get(IS_PUBLIC_KEY, InternalController)).toBe(true);
  });
});
