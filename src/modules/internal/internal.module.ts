import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '@common/guards';
import { InternalController } from './internal.controller';

@Module({
  controllers: [InternalController],
  providers: [ApiKeyGuard],
})
export class InternalModule {}
