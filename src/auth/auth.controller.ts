import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncomingHttpHeaders } from 'http';
import { AuthService } from './auth.service';
import { Auth, GetUser, RawHeaders, RoleProtected } from './decorators';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      ok: true,
      mge: 'Hola mundo',
      user,
      userEmail,
      rawHeaders,
      headers,
    };
  }
  //@SetMetadata('roles', ['admin', 'super-user'])
  @Get('private2')
  @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  testingPrivateRoute2(
    @GetUser()
    user: User,
  ) {
    return {
      ok: true,
      mge: 'Hola mundo',
      user,
    };
  }
  @Get('private3')
  @Auth()
  testingPrivateRoute3(
    @GetUser()
    user: User,
  ) {
    return {
      ok: true,
      mge: 'Hola mundo',
      user,
    };
  }
  @Get('private4')
  @Auth(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  testingPrivateRoute4(
    @GetUser()
    user: User,
  ) {
    return {
      ok: true,
      mge: 'Hola mundo',
      user,
    };
  }
}
