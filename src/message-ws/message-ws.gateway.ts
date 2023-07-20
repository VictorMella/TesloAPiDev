import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JWTPayload } from '../auth/interfaces';
import { NewMessageDto } from './dto/new message.dto';
import { MessageWsService } from './message-ws.service';

@WebSocketGateway({
  cors: true,
})
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  constructor(
    private readonly messageWsService: MessageWsService,
    private readonly jwtService: JwtService,
  ) {}
  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;

    let payload: JWTPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messageWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return;
    }
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnectedClients(),
    );
  }
  handleDisconnect(client: Socket) {
    this.messageWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-from-client')
  onMessageFormClient(clientWs: Socket, payload: NewMessageDto) {
    console.log('SERVER', clientWs.id, payload);

    //Emite a todos menos al cliente
    /*     clientWs.broadcast.emit('message-from-server', {
      fullName: 'Soy yo',
      message: payload.message || 'No-message!!!',
    }); */

    //Emite solo al cliente
    /*     clientWs.emit('message-from-server', {
      fullName: 'Soy yo',
      message: payload.message || 'No-message!!!',
    }); */

    //A Todos
    this.wss.emit('message-from-server', {
      fullName: this.messageWsService.getUserFullNameBySocket(clientWs.id),
      message: payload.message || 'No-message!!!',
    });
  }
}
