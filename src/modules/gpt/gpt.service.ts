import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GPTService {
  private openai: OpenAI;

  constructor(
    private readonly prismaService: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeSubscriptions(userId: number) {
    const subs = await this.prismaService.user_sub_cards_pivot.findMany({
      where: {
        user_id: userId,
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
    });

    const currencyRates = await this.prismaService.currency_rate.findMany({
      where: {
        from: { in: ['USD', 'EUR'] },
        to: 'RUB',
      },
    });

    const currencyMap = currencyRates.reduce((acc, rate) => {
      acc[rate.from] = rate.rate;
      return acc;
    }, {} as Record<string, number>);

    const formattedList = subs.map((s) => {
      const { sub_card } = s;
      let price = sub_card.price_per_month;
      let currencySymbol = sub_card.currency;
      let convertedPrice = price;

      if (currencySymbol === 'USD' || currencySymbol === 'EUR') {
        const conversionRate = currencyMap[currencySymbol];
        if (conversionRate) {
          convertedPrice = price * conversionRate;
        }
        currencySymbol = 'RUB';
      }

      return `- ${sub_card.name} (${convertedPrice.toFixed(2)} ${currencySymbol})${sub_card.sub_card_category_pivots.map(c => ` — ${c.category.name}`).join(', ')}`;
    }).join('\n');

    const prompt = `
      У вас есть следующие подписки:
      ${formattedList}

      Проанализируйте подписки: какие можно отключить и почему? Дайте рекомендации и рассчитайте потенциальную экономию.
          `;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content;
  }

  async analyzeSub(subscriptionId: number) {
    const sub = await this.prismaService.sub_card.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        sub_card_category_pivots: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!sub) {
      throw new Error('Подписка не найдена');
    }

    // Получаем актуальные курсы валют для конвертации в RUB
    const currencyRates = await this.prismaService.currency_rate.findMany({
      where: {
        from: { in: ['USD', 'EUR'] },
        to: 'RUB',
      },
    });

    const currencyMap = currencyRates.reduce((acc, rate) => {
      acc[rate.from] = rate.rate;
      return acc;
    }, {} as Record<string, number>);

    // Обработка цены и конвертация
    let price = sub.price_per_month;
    let currencySymbol = sub.currency;
    let convertedPrice = price;

    if (currencySymbol === 'USD' || currencySymbol === 'EUR') {
      const conversionRate = currencyMap[currencySymbol];
      if (conversionRate) {
        convertedPrice = price * conversionRate;
      }
      currencySymbol = 'RUB';
    }

    const categories = sub.sub_card_category_pivots.map(c => c.category.name).join(', ');
    const formattedSubscription = `Подписка: ${sub.name} (${convertedPrice.toFixed(2)} ${currencySymbol})\nКатегории: ${categories}`;

    const prompt = `
      У вас есть подписка:
      ${formattedSubscription}
  
      Дайте рекомендации по этой подписке:
      - Есть ли аналогичная подписка дешевле?
      - В чем преимущества этой подписки?
      - Какие недостатки или потенциальные проблемы с этой подпиской?
      - Возможна ли экономия, если отказаться от этой подписки?
  
      Ответьте детально, с учетом информации о стоимости и категориях.
    `;

    // Получаем ответ от OpenAI
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content;
  }

}
