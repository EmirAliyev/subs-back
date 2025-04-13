import { Controller, Get, UseGuards } from '@nestjs/common'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  async getAllCategories() {
    try {
      const categories = await this.categoriesService.getAllCategories()
      return categories
    } catch (error) {
      return { error: 'Не удалось получить категории' }
    }
  }
}
