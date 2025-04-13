import { Module } from '@nestjs/common';
import { PriceParserController } from './price-parser.controller';
import { PriceParserService } from './price-parser.service';

@Module({
  imports: [],
  controllers: [PriceParserController],
  providers: [PriceParserService],
})
export class PriceParserModule { }
