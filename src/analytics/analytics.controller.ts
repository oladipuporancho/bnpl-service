import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard-summary')
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
