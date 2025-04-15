import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { SubCardService } from './subs.service';
import { UserCardActionDto } from './dto/user-card-action.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('sub-cards')
export class SubCardController {
  constructor(private readonly subCardService: SubCardService,
    private jwtService: JwtService,

  ) { }

  @Get()
  async getAllSubCards(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Query('categoryIds') categoryIds = '',
    @Query('search') search = '',
  ) {
    let userId: number | undefined = undefined;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const payload = this.jwtService.verify(token);
        userId = payload.userId;
      } catch {
        userId = undefined;
      }
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 15;
    const categoryIdsArray = categoryIds
      ? categoryIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [];

    const subCards = await this.subCardService.getAllSubCards({
      page: pageNumber,
      limit: limitNumber,
      categoryIds: categoryIdsArray,
      search,
      userId,
    });

    return subCards;
  }

  @Post('add')
  async addSubCardToUser(@Body() body: UserCardActionDto) {
    const result = await this.subCardService.addSubCardToUser(body);
    return result;
  }

  @Put('update')
  async updateUserSubCard(@Body() body: UserCardActionDto) {
    const result = await this.subCardService.updateUserSubCard(body);
    return result;
  }

  // Удаление карточки у пользователя
  @Delete('delete')
  async removeSubCard(@Body() body: UserCardActionDto) {
    const result = await this.subCardService.removeSubCardFromUser(body);
    return result;
  }
  @Get('top')
  async getTopSubs(@Query('take') take?: string) {
    const result = await this.subCardService.getTopSubs(take ? parseInt(take) : 10)
    return result
  }

  @Get('/:slug')
  async getSubBySlug(@Req() req,
    @Param('slug') slug: string) {
    let userId: number | undefined = undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const payload = this.jwtService.verify(token);
        userId = payload.userId;
      } catch {
        userId = undefined;
      }
    }

    const result = this.subCardService.getSubBySlug(slug, userId)
    return result
  }
}
