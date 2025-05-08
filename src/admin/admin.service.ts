import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async updateUserFlagStatus(userId: string, action: 'flag' | 'unflag') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isFlagged: action === 'flag',
      },
    });

    return {
      message: `User ${action}ged successfully`,
      data: updatedUser,
    };
  }

  async approveKYC(
    adminId: string,
    adminPassword: string,
    userId: string,
    decision: 'approve' | 'reject',
  ) {
    // Hardcoded credentials for admin
    if (adminId !== 'Admin 123' || adminPassword !== 'admin 123') {
      throw new BadRequestException('Invalid admin credentials');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: decision === 'approve' ? 'approved' : 'rejected',
      },
    });

    await this.emailService.sendEmail(
      user.email,
      'KYC Status Update',
      decision === 'approve'
        ? 'Your KYC has been approved.'
        : 'Your KYC has been rejected.',
      decision === 'approve'
        ? '<p>Congratulations! Your KYC has been approved.</p>'
        : '<p>Unfortunately, your KYC has been rejected. Please contact support for more details.</p>',
    );

    return {
      message: `KYC ${decision}d successfully`,
      data: updatedUser,
    };
  }
}
