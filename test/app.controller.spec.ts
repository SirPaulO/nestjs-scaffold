import { Reflector } from '@nestjs/core';
import { AppController } from '../src/app.controller';
import { IS_PUBLIC_KEY } from '@common/decorators';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  describe('getHealth', () => {
    it('should return an ok status', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });

    it('should be marked @Public() (no JWT required)', () => {
      const reflector = new Reflector();
      expect(reflector.get(IS_PUBLIC_KEY, controller.getHealth)).toBe(true);
    });
  });
});
