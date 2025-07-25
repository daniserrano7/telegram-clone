import { NestFactory } from '@nestjs/core';
import { Logger, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Configure log levels based on environment
  const logLevels: LogLevel[] = process.env.NODE_ENV === 'production' 
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const logger = new Logger('Bootstrap');

  // Get allowed origins from environment variable
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');

  if (!allowedOrigins) {
    throw new Error('ALLOWED_ORIGINS is not set');
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api');

  // Determine host based on environment
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  const port = process.env.PORT;

  if (!port) {
    throw new Error('PORT is not set');
  }

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Environment: ${process.env.NODE_ENV}`);
}
bootstrap();
