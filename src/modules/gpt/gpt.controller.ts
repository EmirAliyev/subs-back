import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GPTService } from './gpt.service';

@Controller('gpt')
export class GPTController {
  constructor(private readonly gptService: GPTService) { }

  @Get('/my-subs-analyze/:userId')
  async analyzeSubscriptions(@Param('userId') userId: string) {
    const analysisResult = await this.gptService.analyzeSubscriptions(Number(userId));
    return { analysis: analysisResult };
  }

  @Get('/analyze-sub/:subId')
  async analyzeSub(@Param('subId') subId: string) {
    const analysisResult = await this.gptService.analyzeSub(Number(subId));
    return { analysis: analysisResult };
  }
}
