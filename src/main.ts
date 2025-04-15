import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isDev } from './common/helpers/isEnvMode';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: isDev()
      ? 'http://localhost:3000' 
      : (origin, callback) => {
        const allowed = [
          'https://subradar.ru',
          'https://www.subradar.ru',
          'https://api.subradar.ru'
        ];
        if (!origin || allowed.some(allowedOrigin =>
          origin === allowedOrigin ||
          origin.startsWith(`https://${allowedOrigin.replace(/^https?:\/\//, '')}`)
        )) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Добавляем OPTIONS
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Cookie',
      'Accept'
    ],
    credentials: true,
    exposedHeaders: ['Set-Cookie'], 
    maxAge: 86400 
  });
  app.setGlobalPrefix('api');

  const port = isDev() ? process.env.LISTEN_PORT_DEV : process.env.LISTEN_PORT;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}/api`);
}

bootstrap();
