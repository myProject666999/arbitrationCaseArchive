import { Controller, Get, UseGuards, Query, Logger, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LogService, LogQueryParams } from './log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('操作日志')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LogController {
  private readonly logger = new Logger(LogController.name);

  constructor(private readonly logService: LogService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询操作日志' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID', example: 1 })
  @ApiQuery({ name: 'operationType', required: false, description: '操作类型', example: 'login' })
  @ApiQuery({ name: 'startTime', required: false, description: '开始时间', example: '2024-01-01 00:00:00' })
  @ApiQuery({ name: 'endTime', required: false, description: '结束时间', example: '2024-12-31 23:59:59' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  async findAll(
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('operationType') operationType?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
  ) {
    this.logger.debug(`查询操作日志, userId: ${userId}, operationType: ${operationType}`);

    const params: LogQueryParams = {
      userId,
      operationType,
      startTime,
      endTime,
      page,
      pageSize,
    };

    const result = await this.logService.findAll(params);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }
}
