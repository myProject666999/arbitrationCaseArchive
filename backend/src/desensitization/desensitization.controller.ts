import { Controller, Post, Get, Delete, Body, Param, UseGuards, Logger, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DesensitizationService } from './desensitization.service';
import { PreviewDesensitizeDto, ApplyDesensitizeDto } from './dto/desensitize.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { DesensitizationResult } from '../common/utils/desensitization.util';
import { DesensitizedVersion } from '../common/entities/desensitized-version.entity';

@ApiTags('脱敏管理')
@Controller('desensitization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DesensitizationController {
  private readonly logger = new Logger(DesensitizationController.name);

  constructor(private readonly desensitizationService: DesensitizationService) {}

  @Post('preview')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '预览脱敏效果（不保存）' })
  @ApiResponse({ status: 200, description: '预览成功', type: Object })
  async previewDesensitization(
    @Body() dto: PreviewDesensitizeDto,
    @CurrentUser() user: User,
  ): Promise<{ code: number; message: string; data: DesensitizationResult }> {
    this.logger.debug(`用户 ${user.username} 请求预览脱敏效果, OCR版本ID: ${dto.ocrVersionId}`);
    const result = await this.desensitizationService.previewDesensitization(dto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Post('apply')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '应用脱敏并保存' })
  @ApiResponse({ status: 201, description: '脱敏成功', type: Object })
  async applyDesensitization(
    @Body() dto: ApplyDesensitizeDto,
    @CurrentUser() user: User,
  ): Promise<{ code: number; message: string; data: DesensitizedVersion }> {
    this.logger.debug(`用户 ${user.username} 请求应用脱敏, OCR版本ID: ${dto.ocrVersionId}`);
    const result = await this.desensitizationService.applyDesensitization(dto, user);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get('history/:ocrVersionId')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '查询脱敏历史' })
  @ApiParam({ name: 'ocrVersionId', description: 'OCR版本ID', example: 1 })
  async getDesensitizationHistory(
    @Param('ocrVersionId', ParseIntPipe) ocrVersionId: number,
    @CurrentUser() user: User,
  ): Promise<{ code: number; message: string; data: DesensitizedVersion[] }> {
    this.logger.debug(`用户 ${user.username} 查询OCR版本 ${ocrVersionId} 的脱敏历史`);
    const history = await this.desensitizationService.getDesensitizationHistory(ocrVersionId, user);
    return {
      code: 200,
      message: 'success',
      data: history,
    };
  }

  @Get('version/:id')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '获取脱敏版本详情' })
  @ApiParam({ name: 'id', description: '脱敏版本ID', example: 1 })
  async getDesensitizedVersion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ code: number; message: string; data: DesensitizedVersion }> {
    this.logger.debug(`用户 ${user.username} 查询脱敏版本详情: ${id}`);
    const version = await this.desensitizationService.getDesensitizedVersion(id, user);
    return {
      code: 200,
      message: 'success',
      data: version,
    };
  }

  @Delete('version/:id')
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: '删除脱敏版本' })
  @ApiParam({ name: 'id', description: '脱敏版本ID', example: 1 })
  async deleteDesensitizedVersion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ code: number; message: string; data: null }> {
    this.logger.debug(`用户 ${user.username} 删除脱敏版本: ${id}`);
    await this.desensitizationService.deleteDesensitizedVersion(id, user);
    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }
}
