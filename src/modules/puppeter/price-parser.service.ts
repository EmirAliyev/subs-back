import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import axios from 'axios';

@Injectable()
export class PriceParserService {
  async parsePrice(subCardId: string) {

    const instruction = await this.getParsingInstructionFromDB(subCardId);

    if (!instruction) {
      return { error: 'Инструкция не найдена' };
    }

    let price = null;

    if (instruction.type === 'api') {
      price = await this.fetchPriceFromApi(instruction);
    } else if (instruction.type === 'selector') {
      price = await this.fetchPriceWithSelector(instruction);
    }

    if (price === null) {
      return { error: 'Не удалось получить цену' };
    }

    console.log(`💰 Цена получена: ${price}`);
    await this.updateSubCardPrice(subCardId, price);

    return { subCardId, price };
  }

  private async fetchPriceFromApi(instruction: any): Promise<number | null> {
    try {
      const {
        url,
        pricePath,
        method = 'GET',
        body = {},
        headers = {},
      } = instruction;

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Forwarded-For': '8.8.8.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      };

      const finalHeaders = { ...defaultHeaders, ...headers };

      let response;

      if (method.toUpperCase() === 'POST') {
        response = await axios.post(url, body, { headers: finalHeaders });
      } else {
        response = await axios.get(url, { headers: finalHeaders });
      }

      const extractedPrice = this.extractValue(response.data, pricePath);

      return extractedPrice;
    } catch (error) {
      console.error('❌ Ошибка при запросе к API:', error);
      return null;
    }
  }

  private async fetchPriceWithSelector(instruction: any) {
    const { url, actions = [] } = instruction;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Выполняем действия, такие как клик или поиск по селектору
    for (const action of actions) {
      if (action.type === 'click' && action.selector) {
        console.log(`Клик по элементу с селектором: ${action.selector}`);
        await page.click(action.selector);
      }

      if (action.type === 'waitForSelector' && action.selector) {
        console.log(`Ожидаем появления элемента с селектором: ${action.selector}`);
        await page.waitForSelector(action.selector, { timeout: 10000 });
      }

      if (action.type === 'extractText' && action.selector) {
        console.log(`Извлекаем текст из элемента с селектором: ${action.selector}`);
        const rawText: string | null = await page.$eval(
          action.selector,
          el => el.textContent?.trim() || null,
        );

        if (rawText) {
          const match = rawText.match(
            /([$€£₽]|USD|EUR|RUB|GBP|руб|р)\s?\d{1,3}(?:[ ,]?\d{3})*(?:[.,]\d{2})?|(\d{1,3}(?:[ ,]?\d{3})*(?:[.,]\d{2})?)\s?([$€£₽]|USD|EUR|RUB|GBP|руб|р)/i
          );
          await browser.close();
          return match ? match[0].replace(/\s+/g, ' ').trim() : null;
        }
      }
    }

    await browser.close();
    return null;
  }

  private extractValue(obj: any, path: string): any {
    const result = path.split('.').reduce((acc, key) => {
      // Обрабатываем индекс массива (например, [0])
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0];
        const index = parseInt(key.split('[')[1].split(']')[0], 10);
        return acc?.[arrayKey]?.[index];
      }
      return acc?.[key];
    }, obj);
    return result;
  }

  private async getParsingInstructionFromDB(subCardId: string) {
    return {
      type: 'selector',
      url: 'https://docs.ozon.com/common/ozon-premium/?country=RU',
      pricePath: '',
      actions: [
        {
          type: 'waitForSelector',
          selector: '.Price.Price--lg.Price--gray.Price--label', 
        },
        {
          type: 'extractText',
          selector: '.Price.Price--lg.Price--gray.Price--label',         },
      ],
      method: 'GET',
    };
  }

  private async updateSubCardPrice(subCardId: string, price: number) {
    console.log(`✅ Цена ${price} записана для sub_card ${subCardId}`);
  }
}
