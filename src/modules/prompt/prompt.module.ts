import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';  
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';

@Module({
  imports: [HttpModule],  
  controllers: [PromptController],
  providers: [PromptService],
})
export class PromptModule {}
