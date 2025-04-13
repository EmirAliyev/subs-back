import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isDev } from './common/helpers/isEnvMode';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: isDev()
      ? '*'
      : (origin, callback) => {
        const allowed = ['https://subradar.ru', 'https://www.subradar.ru', 'https://api.subradar.ru'];
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.setGlobalPrefix('api');

  const port = isDev() ? process.env.LISTEN_PORT_DEV : process.env.LISTEN_PORT;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}/api`);
}

bootstrap();
