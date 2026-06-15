import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Logger, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { Express } from 'express';

@ApiTags('文件管理')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: '分页查询文件列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
  ) {
    this.logger.debug(`分页查询文件, page: ${page}, pageSize: ${pageSize}`);
    const result = await this.documentService.findAll(page, pageSize);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询文件详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`查询文件详情: ${id}`);
    const document = await this.documentService.findOne(id);
    return {
      code: 200,
      message: 'success',
      data: document,
    };
  }

  @Get('volume/:volumeId')
  @ApiOperation({ summary: '根据卷册ID查询文件列表' })
  async findByVolumeId(@Param('volumeId', ParseIntPipe) volumeId: number) {
    this.logger.debug(`根据卷册ID查询文件: ${volumeId}`);
    const documents = await this.documentService.findByVolumeId(volumeId);
    return {
      code: 200,
      message: 'success',
      data: documents,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建文件记录' })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`创建文件: ${createDocumentDto.documentName}, 用户: ${user.username}`);
    const document = await this.documentService.create(createDocumentDto, user);
    return {
      code: 200,
      message: 'success',
      data: document,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '文件',
        },
        volumeId: {
          type: 'number',
          description: '卷册ID',
          example: 1,
        },
      },
      required: ['file', 'volumeId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('volumeId', ParseIntPipe) volumeId: number,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`上传文件: ${file.originalname}, 卷册ID: ${volumeId}, 用户: ${user.username}`);
    const document = await this.documentService.uploadDocument(file, volumeId, user);
    return {
      code: 200,
      message: 'success',
      data: document,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文件信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    this.logger.debug(`更新文件: ${id}`);
    const document = await this.documentService.update(id, updateDocumentDto);
    return {
      code: 200,
      message: 'success',
      data: document,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`删除文件: ${id}`);
    await this.documentService.remove(id);
    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }
}
