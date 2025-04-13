import { Module } from '@nestjs/common';
import { SubCardController } from './subs.controller';
import { SubCardService } from './subs.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [SubCardController],
  providers: [SubCardService, PrismaService],  
})
export class SubCardModule {}
