import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';

@ApiTags('案件管理')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CaseController {
  private readonly logger = new Logger(CaseController.name);

  constructor(private readonly caseService: CaseService) {}

  @Get()
  @ApiOperation({ summary: '分页查询案件列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', description: '每页条数', required: false, example: 10 })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: false })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('keyword') keyword?: string,
  ) {
    this.logger.debug(`用户 ${user.username} 查询案件列表`);
    const data = await this.caseService.findAll(Number(page), Number(pageSize), keyword);
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取案件详情（包含卷册和文件信息）' })
  @ApiParam({ name: 'id', description: '案件ID', example: 1 })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.debug(`用户 ${user.username} 获取案件详情: ${id}`);
    const data = await this.caseService.findOne(Number(id));
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  @Get('number/:caseNumber')
  @ApiOperation({ summary: '根据案件编号获取案件详情' })
  @ApiParam({ name: 'caseNumber', description: '案件编号', example: 'ARB2024001' })
  async findByCaseNumber(@Param('caseNumber') caseNumber: string, @CurrentUser() user: User) {
    this.logger.debug(`用户 ${user.username} 根据编号查询案件: ${caseNumber}`);
    const data = await this.caseService.findByCaseNumber(caseNumber);
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建案件' })
  async create(@Body() createCaseDto: CreateCaseDto, @CurrentUser() user: User) {
    this.logger.debug(`用户 ${user.username} 创建案件: ${createCaseDto.caseNumber}`);
    const data = await this.caseService.create(createCaseDto, user.id);
    return {
      code: 200,
      message: '创建成功',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新案件' })
  @ApiParam({ name: 'id', description: '案件ID', example: 1 })
  async update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`用户 ${user.username} 更新案件: ${id}`);
    const data = await this.caseService.update(Number(id), updateCaseDto);
    return {
      code: 200,
      message: '更新成功',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除案件' })
  @ApiParam({ name: 'id', description: '案件ID', example: 1 })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.debug(`用户 ${user.username} 删除案件: ${id}`);
    const data = await this.caseService.remove(Number(id));
    return {
      code: 200,
      message: '删除成功',
      data,
    };
  }
}
