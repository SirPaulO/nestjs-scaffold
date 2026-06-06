import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
