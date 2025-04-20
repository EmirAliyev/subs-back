import { Controller, Get, Param, ParseIntPipe, NotFoundException, Body, UseGuards, Post } from '@nestjs/common';
import { GPTService } from './gpt.service';
import { AnalyzeSubDTO } from './gpt-analyze-sub.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('gpt')
export class GPTController {
  constructor(private readonly gptService: GPTService) { }

  @Get('/my-subs-analyze/:userId')
  async analyzeSubscriptions(@Param('userId', ParseIntPipe) userId: number) {
    const analysisResult = await this.gptService.analyzeSubscriptions(userId);
    return { analysis: analysisResult };

  }

  @Post('/analyze-sub')
  async analyzeSub(@Body() body: AnalyzeSubDTO) {
    const analysisResult = await this.gptService.analyzeSub(body);
    return { analysis: analysisResult };
  }
}
