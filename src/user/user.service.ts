import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service'; // Adjust path if needed
import { User, Prisma } from '@prisma/client'; // Ensure correct path for Prisma types

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService, // Adjust path if necessary
  ) {}

  // Fetch all users
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  // Fetch a single user by ID
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Flag or unflag a user
  async flagUser(userId: string, action: 'flag' | 'unflag'): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isFlagged: action === 'flag', // Set isFlagged based on action
      },
    });

    return {
      message: `User ${action}ged successfully`, // Message indicating whether flagged or unflagged
      data: updatedUser, // Return updated user data
    };
  }
}
