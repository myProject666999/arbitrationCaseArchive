import { Controller, Post, Get, Param, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('OCR识别')
@Controller('ocr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly ocrService: OcrService) {}

  @Post('process/:documentId')
  @ApiOperation({ summary: '手动触发OCR处理' })
  @ApiParam({ name: 'documentId', description: '文档ID', type: Number })
  async processOcr(@Param('documentId') documentId: string, @CurrentUser() user: any) {
    const docId = parseInt(documentId, 10);
    if (isNaN(docId)) {
      throw new BadRequestException('无效的文档ID');
    }
    this.logger.debug(`手动触发OCR处理，文档ID: ${docId}，用户: ${user.username}`);
    const result = await this.ocrService.processOcr(docId, user.userId);
    return {
      code: 200,
      message: result.message,
      data: result,
    };
  }

  @Post('batch-process')
  @ApiOperation({ summary: '批量OCR处理' })
  async batchProcessOcr(@Body() body: { documentIds: number[] }, @CurrentUser() user: any) {
    const { documentIds } = body;
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new BadRequestException('文档ID列表不能为空');
    }
    this.logger.debug(`批量OCR处理，文档数量: ${documentIds.length}，用户: ${user.username}`);
    const result = await this.ocrService.batchProcessOcr(documentIds, user.userId);
    return {
      code: 200,
      message: `批量OCR处理完成，成功${result.success}个，失败${result.failed}个`,
      data: result,
    };
  }

  @Get('versions/:documentId')
  @ApiOperation({ summary: '获取文档OCR版本列表' })
  @ApiParam({ name: 'documentId', description: '文档ID', type: Number })
  async getOcrVersions(@Param('documentId') documentId: string) {
    const docId = parseInt(documentId, 10);
    if (isNaN(docId)) {
      throw new BadRequestException('无效的文档ID');
    }
    this.logger.debug(`获取OCR版本列表，文档ID: ${docId}`);
    const versions = await this.ocrService.getOcrVersions(docId);
    return {
      code: 200,
      message: 'success',
      data: {
        versions,
        total: versions.length,
      },
    };
  }

  @Get('version/:ocrVersionId')
  @ApiOperation({ summary: '获取OCR版本详情' })
  @ApiParam({ name: 'ocrVersionId', description: 'OCR版本ID', type: Number })
  async getOcrVersion(@Param('ocrVersionId') ocrVersionId: string) {
    const versionId = parseInt(ocrVersionId, 10);
    if (isNaN(versionId)) {
      throw new BadRequestException('无效的OCR版本ID');
    }
    this.logger.debug(`获取OCR版本详情，版本ID: ${versionId}`);
    const version = await this.ocrService.getOcrVersion(versionId);
    return {
      code: 200,
      message: 'success',
      data: version,
    };
  }

  @Get('compare/:versionId1/:versionId2')
  @ApiOperation({ summary: '比较两个OCR版本差异' })
  @ApiParam({ name: 'versionId1', description: '版本1 ID', type: Number })
  @ApiParam({ name: 'versionId2', description: '版本2 ID', type: Number })
  async compareVersions(
    @Param('versionId1') versionId1: string,
    @Param('versionId2') versionId2: string,
  ) {
    const v1 = parseInt(versionId1, 10);
    const v2 = parseInt(versionId2, 10);
    if (isNaN(v1) || isNaN(v2)) {
      throw new BadRequestException('无效的版本ID');
    }
    this.logger.debug(`比较OCR版本差异，版本1: ${v1}，版本2: ${v2}`);
    const result = await this.ocrService.compareVersions(v1, v2);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }
}
