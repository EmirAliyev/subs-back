import { Controller, Get, Query } from '@nestjs/common';
import { PromptService } from './prompt.service';

@Controller('ai')
export class PromptController {
  constructor(private readonly promptService: PromptService) { }

  @Get('generate')
  async generateResponse(@Query('prompt') prompt: string) {
    const response = await this.promptService.generateResponse(prompt);
    return { response };
  }
}
