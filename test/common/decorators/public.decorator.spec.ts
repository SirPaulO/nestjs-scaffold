import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, Public } from '@common/decorators/public.decorator';

class TestController {
  @Public()
  publicRoute(): void {}

  guardedRoute(): void {}
}

describe('Public decorator', () => {
  it('should attach the IS_PUBLIC_KEY metadata to the handler', () => {
    const reflector = new Reflector();
    const controller = new TestController();

    expect(
      reflector.get(IS_PUBLIC_KEY, controller.publicRoute),
    ).toBe(true);
  });

  it('should leave undecorated handlers without the metadata', () => {
    const reflector = new Reflector();
    const controller = new TestController();

    expect(
      reflector.get(IS_PUBLIC_KEY, controller.guardedRoute),
    ).toBeUndefined();
  });
});
