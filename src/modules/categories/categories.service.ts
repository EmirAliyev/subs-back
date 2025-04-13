import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  async getAllCategories() {
    try {
      const result = await this.prisma.category.findMany()
      return result.map(cat => ({ label: cat.name, key: cat.id }))
    } catch (error) {
      throw new Error('Не удалось получить категории')
    }
  }
}
