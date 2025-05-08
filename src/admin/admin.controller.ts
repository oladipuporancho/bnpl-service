import { Controller, Patch, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('flag-user/:userId')
  async flagUser(
    @Param('userId') userId: string,
    @Body() body: { action: 'flag' | 'unflag' },
  ) {
    return this.adminService.updateUserFlagStatus(userId, body.action);
  }

  @Patch('kyc/:userId/approve')
  async approveKYC(
    @Param('userId') userId: string,
    @Body() body: { adminid: string; adminPassword: string; decision: 'approve' | 'reject' },
  ) {
    return this.adminService.approveKYC(
      body.adminid,
      body.adminPassword,
      userId,
      body.decision,
    );
  }
}
