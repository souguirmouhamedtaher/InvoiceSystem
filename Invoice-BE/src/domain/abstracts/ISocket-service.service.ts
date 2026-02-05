import {
  WebSocketGateway as NestWebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@NestWebSocketGateway()
export abstract class AbstractWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  abstract handleConnection(client: any, ...args: any[]): void;
  abstract handleDisconnect(client: any): void;
  abstract notifyUser(request: any): void;
}
