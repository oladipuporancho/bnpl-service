import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { addMinutes, addHours } from 'date-fns';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

const BASE_URL = 'http://your-app.com';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(
    dto: RegisterDto,
    files: {
      bankStatement?: Express.Multer.File[];
      idDocument?: Express.Multer.File[];
    },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phoneNumber }],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already exists');
    }

    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phoneNumber,
        password: hashedPassword,
        bvn: dto.bvn,
        bankAccount: dto.bankAccountNumber,
        idType: dto.idType,
        kycStatus: 'pending',
      },
    });

    // If files are provided, save the file paths or names (depending on your storage solution)
    const bankStatementPaths = files.bankStatement?.map(file => file.path) || [];
    const idDocumentPaths = files.idDocument?.map(file => file.path) || [];

    // Save file paths in the database or perform any necessary logic here

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const verificationUrl = `${BASE_URL}/verify-email/${token}`;

    await this.emailService.sendEmail(
      user.email,
      'Verify Your Email',
      `Click the link to verify your email: ${verificationUrl}`,
      `<p>Click the link to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    );

    return {
      message: 'Registration successful. Please verify your email.',
      data: {
        access_token: token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phone,
          bvn: user.bvn,
          bankAccountNumber: user.bankAccount,
          idType: user.idType,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
          bankStatement: bankStatementPaths,  // Add file paths to the response
          idDocument: idDocumentPaths,        // Add file paths to the response
        },
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox.',
      );
    }

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      data: {
        access_token: token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phone,
          bvn: user.bvn,
          bankAccountNumber: user.bankAccount,
          idType: user.idType,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
        },
      },
    };
  }

  async adminLogin(dto: LoginDto) {
    const admin = await this.prisma.user.findFirst({
      where: {
        email: dto.identifier,
        isAdmin: true,
      },
    });

    if (!admin || !(await bcrypt.compare(dto.password, admin.password))) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = { sub: admin.id, email: admin.email, isAdmin: true };
    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Admin login successful',
      data: {
        access_token: token,
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
        },
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const { password, ...result } = user;
    return result;
  }

  async createPasswordResetToken(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addMinutes(new Date(), 30);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${BASE_URL}/password-reset/${token}`;

    await this.emailService.sendEmail(
      user.email,
      'Password Reset Request',
      `Click the link below to reset your password:\n\n${resetUrl}`,
      `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
    );

    return { message: 'Password reset token sent to your email.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: resetToken.user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Password successfully reset' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({ where: { token } });

    return { message: 'Email successfully verified' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded: any = this.jwtService.verify(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = { sub: user.id, email: user.email };
      const newAccessToken = await this.jwtService.signAsync(payload);

      return {
        message: 'Token successfully refreshed',
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
