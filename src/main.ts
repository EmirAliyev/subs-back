import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isDev } from './common/helpers/isEnvMode';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.setGlobalPrefix('api');

  const port = isDev() ? process.env.LISTEN_PORT_DEV : process.env.LISTEN_PORT;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}/api`);
}

bootstrap();
