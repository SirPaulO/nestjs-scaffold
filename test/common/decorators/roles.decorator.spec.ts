import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Roles } from '@common/decorators/roles.decorator';

class TestController {
  @Roles('admin', 'manager')
  restrictedRoute(): void {}

  openRoute(): void {}
}

describe('Roles decorator', () => {
  it('should attach the ROLES_KEY metadata with the given roles', () => {
    const reflector = new Reflector();
    const controller = new TestController();

    expect(reflector.get(ROLES_KEY, controller.restrictedRoute)).toEqual([
      'admin',
      'manager',
    ]);
  });

  it('should leave undecorated handlers without the metadata', () => {
    const reflector = new Reflector();
    const controller = new TestController();

    expect(reflector.get(ROLES_KEY, controller.openRoute)).toBeUndefined();
  });
});
