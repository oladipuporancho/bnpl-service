import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { User as PrismaUser } from '@prisma/client';
import { User as GetUser } from './user.decorator'; 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<PrismaUser[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<PrismaUser> {
    return this.usersService.findOne(id);
  }

  @Post('flag')
  async flagUser(
    @Body() body: { action: 'flag' | 'unflag'; userId: string },
    @GetUser() user: PrismaUser,
  ): Promise<any> {
    if (!user.isAdmin) {
      throw new UnauthorizedException('You are not authorized to flag users');
    }

    return this.usersService.flagUser(body.userId, body.action);
  }
}
