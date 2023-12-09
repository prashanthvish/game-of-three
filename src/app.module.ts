import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  providers: [GameGateway],
})
export class AppModule {}
