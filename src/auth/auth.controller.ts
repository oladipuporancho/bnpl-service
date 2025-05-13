import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
@UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'bankStatement', maxCount: 1 },
      { name: 'idDocument', maxCount: 1 },
    ],
    {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = '/tmp/uploads';
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    },
  ),
)
async register(
  @Body() dto: RegisterDto,
  @UploadedFiles()
  files: {
    bankStatement?: Express.Multer.File[];
    idDocument?: Express.Multer.File[];
  },
) {
  try {
    return await this.authService.register(dto, files);
  } catch (error) {
    console.error('Register error:', error);
    throw new InternalServerErrorException('Register failed');
  }
}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin/login')
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body('email') email: string) {
    return this.authService.createPasswordResetToken(email);
  }

  @Post('reset-password')
  resetPassword(@Body() { token, newPassword }: { token: string; newPassword: string }) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }
}
