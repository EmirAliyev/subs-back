import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PriceParserModule } from './modules/puppeter/price-parser.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { SubCardModule } from './modules/subs/subs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UserModule } from './modules/user/user.module';
import { GPTModule } from './modules/gpt/gpt.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    SubCardModule,
    CategoriesModule,
    PriceParserModule,
    UserModule,
    GPTModule,
    PromptModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
