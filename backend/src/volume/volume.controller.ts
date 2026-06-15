import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Logger, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { VolumeService } from './volume.service';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Volume } from '../common/entities/volume.entity';

@ApiTags('卷册管理')
@Controller('volumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VolumeController {
  private readonly logger = new Logger(VolumeController.name);

  constructor(private readonly volumeService: VolumeService) {}

  @Post()
  @ApiOperation({ summary: '创建卷册' })
  async create(@Body() createVolumeDto: CreateVolumeDto, @CurrentUser() user: any) {
    this.logger.debug(`创建卷册请求: ${JSON.stringify(createVolumeDto)}, 用户: ${user.username}`);
    const volume = await this.volumeService.create(createVolumeDto, user.userId);
    return {
      code: 200,
      message: 'success',
      data: volume,
    };
  }

  @Get()
  @ApiOperation({ summary: '分页查询卷册列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false, example: 10 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    this.logger.debug(`分页查询卷册列表: page=${page}, pageSize=${pageSize}`);
    const result = await this.volumeService.findAll(page || 1, pageSize || 10);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: '根据案件ID查询卷册列表' })
  @ApiParam({ name: 'caseId', description: '案件ID', example: 1 })
  async findByCaseId(@Param('caseId', ParseIntPipe) caseId: number) {
    this.logger.debug(`根据案件ID查询卷册列表: caseId=${caseId}`);
    const volumes = await this.volumeService.findByCaseId(caseId);
    return {
      code: 200,
      message: 'success',
      data: volumes,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '查询卷册详情' })
  @ApiParam({ name: 'id', description: '卷册ID', example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`查询卷册详情: ${id}`);
    const volume = await this.volumeService.findOne(id);
    return {
      code: 200,
      message: 'success',
      data: volume,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新卷册' })
  @ApiParam({ name: 'id', description: '卷册ID', example: 1 })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateVolumeDto: UpdateVolumeDto) {
    this.logger.debug(`更新卷册: ${id}, ${JSON.stringify(updateVolumeDto)}`);
    const volume = await this.volumeService.update(id, updateVolumeDto);
    return {
      code: 200,
      message: 'success',
      data: volume,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卷册' })
  @ApiParam({ name: 'id', description: '卷册ID', example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`删除卷册: ${id}`);
    await this.volumeService.remove(id);
    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }
}
