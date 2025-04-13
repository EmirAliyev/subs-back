import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('/subs/:id')
  async getUserSubs(@Param('id') id: string) {
    const result = this.userService.getUserSubs(id)
    return result
  }

  @Get('/subs-categories/:userId')
  async getUserSubsCategories(@Param('userId') userId: string) {
    const result = await this.userService.getUserSubsCategories(userId)
    return result
  }

}
