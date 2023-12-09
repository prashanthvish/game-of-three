import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { GameState } from './gameState';


async function createNestApp(...gateways: any): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: gateways,
  }).compile();

  return testingModule.createNestApplication();
}

describe('GameGateway', () => {
  let gateway: GameGateway;
  let app: INestApplication;

  let ioClient: Socket;
  let ioClient2: Socket;
  let ioClient3: Socket;

  beforeAll(async () => {
    app = await createNestApp(GameGateway);
    gateway = app.get<GameGateway>(GameGateway);

    ioClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ["websocket", "polling"],
    })

    ioClient2 = io('http://localhost:3000', {
      autoConnect: false,
      transports: ["websocket", "polling"],
    })

    ioClient3 = io('http://localhost:3000', {
      autoConnect: false,
      transports: ["websocket", "polling"],
    })

    app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
    ioClient.disconnect();
    ioClient2.disconnect();
    ioClient3.disconnect();
  });


  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should receive whole number when socket client 1 gets connected', async () => {
    ioClient.connect();

    ioClient.on('init', ({ number, message }) => {
      expect(typeof number === 'number').toBeTruthy();
      expect(message).toBe(GameState.waitingForNewPlayer)
    })
  })

  it('should receive whole number and also should be able to play when client 2 gets connected', async () => {
    ioClient2.connect();

    ioClient2.on('init', ({ number, message }) => {
      expect(typeof number === 'number').toBeTruthy();
      expect(message).toBe(GameState.yourTurn);

      ioClient2.emit('move', { number: number, action: 'increment' });
      ioClient2.on('update', ({ number: updatedNumber }) => {
        expect(updatedNumber).toBe(Math.floor((number + 1) / 3))
      })
    })


  })

  it('should not receive whole number when client 3 gets connected', async () => {
    ioClient3.connect();

    ioClient2.on('init', ({ number, message }) => {
      expect(number).toBe('Err');
      expect(message).toBe(GameState.comebackLater);
    })
  })

});
