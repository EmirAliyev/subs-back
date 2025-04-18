import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) { }

  async getUserSubs(userId: string) {
    const [pivotList, currencyRates] = await Promise.all([
      this.prismaService.user_sub_cards_pivot.findMany({
        where: {
          user_id: +userId,
        },
        include: {
          sub_card: {
            include: {
              sub_card_category_pivots: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
  
      this.prismaService.currency_rate.findMany({
        where: {
          to: 'RUB',
        },
      }),
    ]);
  
    const rateMap = currencyRates.reduce<Record<string, number>>((acc, rate) => {
      acc[rate.from] = rate.rate;
      return acc;
    }, {});
  
    return pivotList.map(pivot => {
      const card = pivot.sub_card;
      const cardCurrency = card.currency;
  
      const conversionRate = rateMap[cardCurrency] || 1;
  
      const convertedPrice = Math.round(card.price_per_month * conversionRate);
  
      return {
        ...card,
        is_subscribed: 1,
        date_start: pivot.date_start,
        date_end: pivot.date_end,
        period: pivot.period,
        categories: card.sub_card_category_pivots.map(p => p.category),
        converted_price_rub: convertedPrice,
      };
    });
  }
  

  async getUserSubsCategories(userId: string) {
    const categories = await this.prismaService.category.findMany({
      include: {
        sub_card_category_pivots: {
          include: {
            sub_card: {
              include: {
                user_sub_cards: {
                  where: { user_id: +userId },
                },
              },
            },
          },
        },
      },
    });

    const filtered = categories.map((category) => {
      const subCards = category.sub_card_category_pivots
        .map((pivot) => pivot.sub_card)
        .filter((card) => card.user_sub_cards.length > 0);

      return {
        name: category.name,
        quantity: subCards.length,
      };
    }).filter(c => c.quantity > 0);

    const labels = filtered.map((r) => r.name);
    const quantity = filtered.map((r) => r.quantity);

    return { labels, quantity };
  }


}