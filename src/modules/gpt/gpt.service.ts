import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { AuthGuard } from '../auth/auth.guard';
import { AnalyzeSubDTO } from './gpt-analyze-sub.dto';


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
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { is_premium: true },
    });

    if (!user?.is_premium) {
      throw new BadRequestException('Анализ подписок доступен только для премиум пользователей.');
    }

    // Получаем сегодняшнюю дату без времени
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Получаем или создаём запись анализа
    const analysisCounter = await this.prismaService.user_subscription_analysis_counter.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      create: {
        user_id: userId,
        date: today,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    if (analysisCounter.count > 2) {
      throw new BadRequestException('Вы уже использовали лимит на анализ подписок сегодня.');
    }

    // Получение подписок пользователя
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

    // Получение курсов валют
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

    // Формирование текста для анализа
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

      const categories = sub_card.sub_card_category_pivots.map(c => c.category.name).join(', ');

      return `- ${sub_card.name} (${convertedPrice.toFixed(2)} ${currencySymbol})${categories ? ` — ${categories}` : ''}`;
    }).join('\n');

    const prompt = `
  У вас есть следующие подписки:
  ${formattedList}
  
  Проанализируйте подписки: какие можно отключить и почему? Дайте рекомендации и рассчитайте потенциальную экономию.
  `;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4', messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content;
  }


  async analyzeSub(body: AnalyzeSubDTO) {
    const { user_id, sub_id } = body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.prismaService.user.findUnique({
      where: { id: user_id },
    });

    if (!user) throw new BadRequestException('Пользователь не найден');

    // 1 или 10 в зависимости от подписки
    const dailyLimit = user.is_premium ? 10 : 1;

    // Ищем запись на сегодня
    const existingCounter = await this.prismaService.user_analysis_counter.findUnique({
      where: {
        user_id_date: {
          user_id,
          date: today,
        },
      },
    });

    if (existingCounter && existingCounter.count >= dailyLimit) {
      throw new BadRequestException('Вы уже использовали ваш лимит на анализы сегодня. Приобритайте премиум подписку и увеличьте лимит до 10.');
    }

    const sub = await this.prismaService.sub_card.findUnique({
      where: { id: sub_id },
      include: {
        sub_card_category_pivots: {
          include: { category: true },
        },
      },
    });

    if (!sub) throw new BadRequestException('Подписка не найдена');

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
      model: 'gpt-4', messages: [{ role: 'user', content: prompt }],
    });

    // Обновляем или создаём счётчик
    await this.prismaService.user_analysis_counter.upsert({
      where: {
        user_id_date: {
          user_id,
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        user_id,
        date: today,
        count: 1,
        sub_card_id: sub_id,
      },
    });

    return completion.choices[0].message.content;
  }

}
