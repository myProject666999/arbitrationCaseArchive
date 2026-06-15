import { Controller, Get, Post, Put, Body, Param, UseGuards, Query, Logger, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BorrowService } from './borrow.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ApproveBorrowDto } from './dto/approve-borrow.dto';
import { ReturnBorrowDto } from './dto/return-borrow.dto';
import { RejectBorrowDto } from './dto/reject-borrow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { BorrowStatus } from '../common/entities/borrow-record.entity';

@ApiTags('借阅管理')
@Controller('borrows')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BorrowController {
  private readonly logger = new Logger(BorrowController.name);

  constructor(private readonly borrowService: BorrowService) {}

  @Post('apply')
  @ApiOperation({ summary: '申请借阅' })
  async applyBorrow(
    @Body() createBorrowDto: CreateBorrowDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`申请借阅, 用户: ${user.username}, 文件ID: ${createBorrowDto.documentId}`);
    const result = await this.borrowService.applyBorrow(createBorrowDto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Put(':id/approve')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '审批通过借阅' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async approveBorrow(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveBorrowDto: ApproveBorrowDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`审批通过借阅, 借阅ID: ${id}, 审批人: ${user.username}`);
    const result = await this.borrowService.approveBorrow(id, approveBorrowDto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Put(':id/reject')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '审批拒绝借阅' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async rejectBorrow(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectBorrowDto: RejectBorrowDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`审批拒绝借阅, 借阅ID: ${id}, 审批人: ${user.username}`);
    const result = await this.borrowService.rejectBorrow(id, rejectBorrowDto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Put(':id/return')
  @ApiOperation({ summary: '归还借阅' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async returnBorrow(
    @Param('id', ParseIntPipe) id: number,
    @Body() returnBorrowDto: ReturnBorrowDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`归还借阅, 借阅ID: ${id}, 操作人: ${user.username}`);
    const result = await this.borrowService.returnBorrow(id, returnBorrowDto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Put(':id/lost')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '标记为丢失' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async markAsLost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`标记丢失, 借阅ID: ${id}, 操作人: ${user.username}`);
    const result = await this.borrowService.markAsLost(id, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Put(':id/remind')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '催还借阅' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async remindOverdue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`催还借阅, 借阅ID: ${id}, 操作人: ${user.username}`);
    const result = await this.borrowService.remindOverdue(id, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: '分页查询借阅列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: '借阅状态', enum: ['pending', 'approved', 'rejected', 'returned', 'overdue', 'lost'] })
  @ApiQuery({ name: 'documentId', required: false, description: '文件ID', example: 1 })
  @ApiQuery({ name: 'applicantId', required: false, description: '申请人ID', example: 1 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
    @Query('status') status?: BorrowStatus,
    @Query('documentId', new ParseIntPipe({ optional: true })) documentId?: number,
    @Query('applicantId', new ParseIntPipe({ optional: true })) applicantId?: number,
    @CurrentUser() user?: User,
  ) {
    this.logger.debug(`分页查询借阅记录, page: ${page}, pageSize: ${pageSize}, status: ${status}`);
    const result = await this.borrowService.findAll(page, pageSize, user, status, documentId, applicantId);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的借阅记录' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: '借阅状态', enum: ['pending', 'approved', 'rejected', 'returned', 'overdue', 'lost'] })
  async getMyBorrows(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
    @Query('status') status?: BorrowStatus,
    @CurrentUser() user?: User,
  ) {
    this.logger.debug(`获取用户借阅记录, userId: ${user.id}, page: ${page}, pageSize: ${pageSize}`);
    const result = await this.borrowService.getMyBorrows(user.id, page, pageSize, status);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('pending')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '获取待审批列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  async getPendingApprovals(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
  ) {
    this.logger.debug(`获取待审批列表, page: ${page}, pageSize: ${pageSize}`);
    const result = await this.borrowService.getPendingApprovals(page, pageSize);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('overdue')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '获取逾期列表' })
  async getOverdueList() {
    this.logger.debug(`获取逾期列表`);
    const result = await this.borrowService.getOverdueList();
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取借阅详情' })
  @ApiParam({ name: 'id', description: '借阅记录ID', example: 1 })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`查询借阅详情: ${id}, 用户: ${user.username}`);
    const result = await this.borrowService.findOne(id, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }
}
