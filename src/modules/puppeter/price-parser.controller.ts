import { Controller, Get, Param } from '@nestjs/common';
import { PriceParserService } from './price-parser.service';

@Controller('price-parser')
export class PriceParserController {
  constructor(private readonly priceParserService: PriceParserService) { }

  @Get(':subCardId')
  async parsePrice(@Param('subCardId') subCardId: string) {
    return await this.priceParserService.parsePrice(subCardId);
  }
}
