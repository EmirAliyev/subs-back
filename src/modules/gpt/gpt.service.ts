import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class GPTService {
  private openai: OpenAI;

  constructor(private readonly prismaService: PrismaService) {
    const proxy = 'http://9muHu9bC:F29Wurgp@166.1.187.172:64644';
    const httpsAgent = new HttpsProxyAgent(proxy);

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      httpAgent: httpsAgent,
      timeout: 30000,
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
      model: 'gpt-3.5-turbo',
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

    if (!sub) throw new Error('Подписка не найдена');

    const currencyRates = await this.prismaService.currency_rate.findMany({
      where: { from: { in: ['USD', 'EUR'] }, to: 'RUB' },
    });

    const currencyMap = currencyRates.reduce((acc, rate) => {
      acc[rate.from] = rate.rate;
      return acc;
    }, {} as Record<string, number>);

    let price = sub.price_per_month;
    let currency = sub.currency;
    if (currency === 'USD' || currency === 'EUR') {
      price *= currencyMap[currency] || 1;
      currency = 'RUB';
    }

    const categories = sub.sub_card_category_pivots.map(c => c.category.name).join(', ');

    const prompt = `
        Подписка: ${sub.name} (${price.toFixed(2)} ${currency})
        Категории: ${categories}

        Дай краткий и структурированный анализ в формате:

        Аналоги дешевле:
        - Есть ли подписки с аналогичным функционалом дешевле? Приведи примеры без цен, если не уверен.

        Преимущества:
        - В чём сильные стороны этой подписки?

        Недостатки:
        - Что может не устроить пользователя?

        Экономия:
        - Есть ли смысл отказаться? Если да — почему и что можно выбрать вместо.

        Не выдумывай цены. Отвечай ясно, без вступлений и повторов вопросов.
        `.trim();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content;
  }
}
