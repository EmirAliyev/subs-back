import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GPTController } from './gpt.controller';
import { GPTService } from './gpt.service';
@Module({
  imports: [],
  controllers: [GPTController],
  providers: [GPTService, PrismaService],
})
export class GPTModule { }
