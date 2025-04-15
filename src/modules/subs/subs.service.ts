import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserCardActionDto } from './dto/user-card-action.dto';

@Injectable()
export class SubCardService {
  constructor(private readonly prismaService: PrismaService) { }

  async getAllSubCards({
    page,
    limit,
    categoryIds,
    search,
    userId,
  }: {
    page: number;
    limit: number;
    categoryIds?: number[];
    search?: string;
    userId?: number; // теперь необязательный
  }): Promise<{
    data: any[];
    meta: {
      total: number;
      pages: number;
      currentPage: number;
      perPage: number;
    };
  }> {
    try {
      const whereCondition: any = {};

      if (categoryIds && categoryIds.length > 0) {
        whereCondition.sub_card_category_pivots = {
          some: {
            category_id: {
              in: categoryIds,
            },
          },
        };
      }

      if (search) {
        whereCondition.name = { contains: search };
      }

      const [cards, total] = await Promise.all([
        this.prismaService.sub_card.findMany({
          skip: (page - 1) * limit,
          take: limit,
          include: {
            sub_card_category_pivots: {
              include: {
                category: true,
              },
            },
            user_sub_cards: userId
              ? {
                where: {
                  user_id: userId,
                },
                select: {
                  id: true,
                  date_start: true,
                  date_end: true,
                  period: true,
                },
              }
              : false,
          },
          where: whereCondition,
        }),
        this.prismaService.sub_card.count({
          where: whereCondition,
        }),
      ]);

      const data = cards.map(({ user_sub_cards = [], sub_card_category_pivots, ...rest }) => ({
        ...rest,
        is_subscribed: user_sub_cards.length > 0,
        subscription: user_sub_cards.length > 0 ? user_sub_cards[0] : null,
        categories: sub_card_category_pivots.map((pivot) => pivot.category),
      }));

      const pages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          pages,
          currentPage: page,
          perPage: limit,
        },
      };
    } catch (error) {
      throw new Error('Не удалось получить карточки');
    }
  }

  async getSubBySlug(slug: string, userId?: number) {
    const sub = await this.prismaService.sub_card.findFirst({
      where: { slug },
      include: {
        sub_card_category_pivots: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!sub) return null;

    const baseData = {
      ...sub,
      categories: sub.sub_card_category_pivots.map((pivot) => pivot.category),
    };

    if (typeof userId !== 'number') {
      return baseData;
    }

    const userSubscription = await this.prismaService.user_sub_cards_pivot.findFirst({
      where: {
        user_id: userId,
        sub_card_id: sub.id,
      },
      select: {
        id: true,
        date_start: true,
        date_end: true,
        period: true,
      },
    });

    return {
      ...baseData,
      is_subscribed: !!userSubscription,
      subscription: userSubscription ?? null,
    };
  }



  async addSubCardToUser(body: UserCardActionDto) {
    try {
      const { user_id, card_id, date_start, period } = body;

      const user = await this.prismaService.user.findUnique({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      const subCard = await this.prismaService.sub_card.findUnique({ where: { id: card_id } });
      if (!subCard) {
        throw new NotFoundException('Карточка не найдена');
      }

      const existingSubscription = await this.prismaService.user_sub_cards_pivot.findFirst({
        where: {
          user_id: user_id,
          sub_card_id: card_id,
        },
      });

      if (existingSubscription) {
        throw new BadRequestException('Пользователь уже подписан на эту карточку');
      }

      const startDate = new Date(date_start);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (30 * period));

      const endDateStr = endDate.toISOString().split('T')[0];

      await this.prismaService.user_sub_cards_pivot.create({
        data: {
          user_id: user_id,
          sub_card_id: card_id,
          date_start: date_start,
          date_end: endDateStr,
          period: +period,
        },
      });

      return { success: true, message: 'Карточка успешно добавлена пользователю' };

    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Не удалось добавить карточку');
    }
  }

  async updateUserSubCard(body: UserCardActionDto) {
    try {
      const { user_id, card_id, date_start, period } = body;

      const existingSubscription = await this.prismaService.user_sub_cards_pivot.findFirst({
        where: {
          user_id: user_id,
          sub_card_id: card_id,
        },
      });

      if (!existingSubscription) {
        throw new NotFoundException('Подписка не найдена');
      }

      const start = new Date(date_start);
      const end = new Date(start);
      end.setDate(end.getDate() + (30 * period));

      await this.prismaService.user_sub_cards_pivot.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          date_start: date_start,
          date_end: end.toISOString(),
          period: +period,
        },
      });

      return { success: true, message: 'Подписка успешно обновлена' };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.log(error)
      throw new BadRequestException('Не удалось обновить подписку');
    }
  }



  async removeSubCardFromUser(body) {
    try {
      const { user_id, card_id } = body;

      const user = await this.prismaService.user.findUnique({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      const subCard = await this.prismaService.sub_card.findUnique({ where: { id: card_id } });
      if (!subCard) {
        throw new NotFoundException('Карточка не найдена');
      }

      const userSubCard = await this.prismaService.user_sub_cards_pivot.findUnique({
        where: {
          user_id_sub_card_id: {
            user_id,
            sub_card_id: card_id,
          },
        },
      });

      if (!userSubCard) {
        throw new NotFoundException('Подписка не найдена');
      }

      await this.prismaService.user_sub_cards_pivot.delete({
        where: {
          id: userSubCard.id,
        },
      });

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Не удалось удалить карточку');
    }
  }

  async getTopSubs(take = 10) {
    const subs = await this.prismaService.sub_card.findMany({
      orderBy: {
        user_sub_cards: {
          _count: 'desc',
        },
      },
      take: take,
      include: {
        sub_card_category_pivots: {
          include: {
            category: true,
          },
        },
      },
    });

    return subs.map((sub) => {
      const { sub_card_category_pivots, ...rest } = sub;
      return {
        ...rest,
        categories: sub_card_category_pivots.map((pivot) => ({
          id: pivot.category.id,
          name: pivot.category.name,
        })),
      };
    });

  }




}
