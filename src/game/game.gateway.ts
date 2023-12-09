import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameState } from './gameState';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerQueue: Array<string> = [];
  private currentNumber: number | null = null;


  @SubscribeMessage('move')
  handleMove(client: any, payload: any) {
    let number = Number(payload.number);
    let { action } = payload;

    if (action === 'increment') {
      number = (number + 1) / 3
    }

    if (action === 'decrement') {
      number = (number - 1) / 3
    }

    if (action === 'stayZero') {
      number = (number / 3);
    }

    number = Math.floor(number);
    this.currentNumber = number;
    const otherPlayer = this.playerQueue.filter(player => player !== client.id)[0];

    this.server.to(this.playerQueue).emit('update', { player: client.id, number, action })
    this.server.to(client.id).emit('wait', { message: GameState.waitingForPlayerTurn })

    if (number === 1) {
      this.currentNumber = null;
      this.server.to(otherPlayer).emit('gameover', { message: GameState.gameOverYouLost });
      return this.server.to(client.id).emit('gameover', { message: GameState.gameOverYouWon });
    }


    return this.server.to(otherPlayer).emit('turn', { message: GameState.yourTurn });

  }

  handleConnection(client: any, ...args: any[]) {
    if (!this.currentNumber)
      this.currentNumber = Math.floor(Math.random() * 100) + 1;

    if (this.playerQueue.length === 0) {
      this.playerQueue.push(client.id);
      return this.server
        .to(client.id)
        .emit('init', {
          id: client.id,
          number: this.currentNumber,
          message: GameState.waitingForNewPlayer,
        });
    }


    if (this.playerQueue.length === 1) {
      this.server
        .to(client.id)
        .emit('init', {
          id: client.id,
          number: this.currentNumber,
          message: GameState.waitingForPlayerTurn,
        });

      const otherPlayer = this.playerQueue[0];
      this.playerQueue.push(client.id);

      this.server.to(otherPlayer)
        .emit('wait', { message: GameState.waitingForPlayerTurn });


      return this.server.to(client.id).emit('turn', { message: GameState.yourTurn });

    }

    return this.server.to(client.id).emit('init', { id: client.id, number: 'Err', message: GameState.comebackLater });
  }

  handleDisconnect(client: any) {
    this.playerQueue = this.playerQueue.filter(player => player !== client.id);
  }
}
