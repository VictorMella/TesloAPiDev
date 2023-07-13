import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        /*         console.log('JWT_SECRET', process.env.JWT_SECRET);
        console.log('JWT_SECRET', configService.get('JWT_SECRET')); */
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h', // token valid for half an hour (in
          },
        };
      },
    }),
    /*     JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '2h', // token valid for half an hour (in
      },
    }), */
  ],
  exports: [AuthService, TypeOrmModule, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
