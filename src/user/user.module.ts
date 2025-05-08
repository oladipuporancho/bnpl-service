import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module'; // 👈 correct the path if needed

@Module({
  imports: [PrismaModule, AdminModule], // 👈 import AdminModule
  controllers: [UsersController],
  providers: [UsersService],
})
export class UserModule {}
