import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

interface ConnectedClients {
  [id: string]: {
    socket: Socket;
    user: User;
  };
}

@Injectable()
export class MessageWsService {
  private connectedClients: ConnectedClients = {};

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registerClient(client: Socket, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('No hay usuario con ese id');
    if (!user.isActive) throw new Error('Usuario no esta activo');
    this.checkUserConenction(user);
    this.connectedClients[client.id] = {
      socket: client,
      user,
    };
  }

  removeClient(clientID: string) {
    delete this.connectedClients[clientID];
  }

  getConnectedClients(): string[] {
    return Object.keys(this.connectedClients);
  }

  getUserFullNameBySocket(socketID: string) {
    return this.connectedClients[socketID].user.fullName;
  }

  private checkUserConenction(user: User) {
    //TODO implementar metodo para chequear si el cliente se encuentra conectado
    for (const clientId of Object.keys(this.connectedClients)) {
      const connectedClient = this.connectedClients[clientId];
      if (connectedClient.user.id === user.id) {
        connectedClient.socket.disconnect();
        break;
      }
    }
  }
}
