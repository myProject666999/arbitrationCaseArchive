import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Logger, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';

@ApiTags('标注管理')
@Controller('annotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnotationController {
  private readonly logger = new Logger(AnnotationController.name);

  constructor(private readonly annotationService: AnnotationService) {}

  @Get()
  @ApiOperation({ summary: '分页查询标注列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
  ) {
    this.logger.debug(`分页查询标注, page: ${page}, pageSize: ${pageSize}`);
    const result = await this.annotationService.findAll(page, pageSize);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: '根据文档ID查询标注列表' })
  async findByDocumentId(@Param('documentId', ParseIntPipe) documentId: number) {
    this.logger.debug(`根据文档ID查询标注: ${documentId}`);
    const annotations = await this.annotationService.findByDocumentId(documentId);
    return {
      code: 200,
      message: 'success',
      data: annotations,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询标注详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`查询标注详情: ${id}`);
    const annotation = await this.annotationService.findOne(id);
    return {
      code: 200,
      message: 'success',
      data: annotation,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建标注' })
  async create(
    @Body() createAnnotationDto: CreateAnnotationDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`创建标注, 用户: ${user.username}`);
    const annotation = await this.annotationService.create(createAnnotationDto, user);
    return {
      code: 200,
      message: 'success',
      data: annotation,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新标注' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnotationDto: UpdateAnnotationDto,
  ) {
    this.logger.debug(`更新标注: ${id}`);
    const annotation = await this.annotationService.update(id, updateAnnotationDto);
    return {
      code: 200,
      message: 'success',
      data: annotation,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标注' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`删除标注: ${id}`);
    await this.annotationService.remove(id);
    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }
}
