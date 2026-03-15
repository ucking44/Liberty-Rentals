import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

    app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    app.use('/payments/webhook', bodyParser.json({
        verify: (req: any, res, buf) => {
            req.rawBody = buf.toString();
        },
    }));

    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    const port = 3000;

    await app.listen(process.env.PORT ?? port, () => {
        console.log(`Waste Pickup App listening on PORT: ${process.env.PORT ?? port}`);
    });
}

bootstrap().catch((err) => {
    console.error('Application failed to start:', err);
    process.exit(1);
});
