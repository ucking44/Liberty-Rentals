// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as dotenv from 'dotenv';
// import { join } from 'path';
// import { NestExpressApplication } from '@nestjs/platform-express';

// dotenv.config();

// async function bootstrap() {
//     const app = await NestFactory.create<NestExpressApplication>(AppModule);

//     app.useStaticAssets(join(__dirname, '..', 'uploads'), {
//         prefix: '/uploads/',
//     });

//     //app.useStaticAssets(join(__dirname, '..', 'uploads')); // Serve /uploads

//     const port = process.env.PORT ?? 4000;

//     await app.listen(port, () => {
//         console.log(`Thrift Fintech App is listening on PORT: ${port}`);
//     });
// }
// bootstrap();
