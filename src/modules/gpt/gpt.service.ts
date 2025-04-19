import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GPTService {
  private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly API_KEY = process.env.PROXY_OPEN_AI_KEY;

  constructor(private readonly prismaService: PrismaService) { }

  private async askModel(messages: { role: 'user' | 'system' | 'assistant'; content: string }[]) {
    try {
      const res = await axios.post(
        this.OPENROUTER_API_URL,
        {
          model: 'openai/gpt-3.5-turbo',
          messages,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://subradar.ru',
            'X-Title': 'SubRadar Assistant',
          },
        }
      );
      console.log(res.data,53453)
      return res.data.choices[0].message.content;
    } catch (err) {
      console.error('OpenRouter error:', err?.response?.data || err);
      throw new HttpException('Ошибка при обращении к языковой модели', HttpStatus.BAD_GATEWAY);
    }
  }

  async analyzeSubscriptions(userId: number) {
    const subs = await this.prismaService.user_sub_cards_pivot.findMany({
      where: { user_id: userId },
      include: {
        sub_card: {
          include: {
            sub_card_category_pivots: {
              include: { category: true },
            },
          },
        },
      },
    });

    const currencyRates = await this.prismaService.currency_rate.findMany({
      where: { from: { in: ['USD', 'EUR'] }, to: 'RUB' },
    });

    const currencyMap = currencyRates.reduce((acc, rate) => {
      acc[rate.from] = rate.rate;
      return acc;
    }, {} as Record<string, number>);

    const formattedList = subs.map((s) => {
      const { sub_card } = s;
      let price = sub_card.price_per_month;
      let currency = sub_card.currency;
      if (currency === 'USD' || currency === 'EUR') {
        price *= currencyMap[currency] || 1;
        currency = 'RUB';
      }
      return `- ${sub_card.name} (${price.toFixed(2)} ${currency})${sub_card.sub_card_category_pivots.map(c => ` — ${c.category.name}`).join(', ')}`;
    }).join('\n');

    const prompt = `
У вас есть следующие подписки:
${formattedList}

Проанализируйте подписки: какие можно отключить и почему? Дайте рекомендации и рассчитайте потенциальную экономию.
    `.trim();

    return this.askModel([{ role: 'user', content: prompt }]);
  }

  async analyzeSub(subscriptionId: number) {
    const sub = await this.prismaService.sub_card.findUnique({
      where: { id: subscriptionId },
      include: {
        sub_card_category_pivots: {
          include: { category: true },
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
    const formatted = `Подписка: ${sub.name} (${price.toFixed(2)} ${currency})\nКатегории: ${categories}`;

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


    return this.askModel([{ role: 'user', content: prompt }]);
  }
}
