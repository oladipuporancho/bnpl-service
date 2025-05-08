import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { LoansModule } from './loans/loan.module';
import { PrismaService } from './prisma/prisma.service';
import { AdminModule } from './admin/admin.module'; // ✅ Import AdminModule

@Module({
  imports: [
    AuthModule,
    UserModule,
    EmailModule,
    LoansModule,
    AdminModule, // ✅ Register AdminModule here
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
