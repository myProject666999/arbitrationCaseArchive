import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreviewDesensitizeDto, ApplyDesensitizeDto } from './dto/desensitize.dto';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { DesensitizedVersion } from '../common/entities/desensitized-version.entity';
import { User } from '../common/entities/user.entity';
import { desensitize, getDefaultRules, DesensitizationResult } from '../common/utils/desensitization.util';

@Injectable()
export class DesensitizationService {
  private readonly logger = new Logger(DesensitizationService.name);

  constructor(
    @InjectRepository(OcrVersion)
    private ocrVersionRepository: Repository<OcrVersion>,
    @InjectRepository(DesensitizedVersion)
    private desensitizedVersionRepository: Repository<DesensitizedVersion>,
  ) {}

  async previewDesensitization(dto: PreviewDesensitizeDto, user: User): Promise<DesensitizationResult> {
    this.logger.debug(`用户 ${user.username} 预览脱敏效果, OCR版本ID: ${dto.ocrVersionId}`);

    const ocrVersion = await this.ocrVersionRepository.findOne({
      where: { id: dto.ocrVersionId },
    });
    if (!ocrVersion) {
      this.logger.error(`OCR版本不存在: ${dto.ocrVersionId}`);
      throw new NotFoundException('OCR版本不存在');
    }

    if (!ocrVersion.ocrText) {
      this.logger.warn(`OCR版本 ${dto.ocrVersionId} 没有OCR文本`);
      throw new BadRequestException('该OCR版本没有可脱敏的文本内容');
    }

    const rules = dto.rules || getDefaultRules();
    const result = desensitize(ocrVersion.ocrText, rules);

    this.logger.log(`预览脱敏完成, 共处理 ${result.count} 处敏感信息`);
    return result;
  }

  async applyDesensitization(dto: ApplyDesensitizeDto, user: User): Promise<DesensitizedVersion> {
    this.logger.debug(`用户 ${user.username} 应用脱敏, OCR版本ID: ${dto.ocrVersionId}`);

    const ocrVersion = await this.ocrVersionRepository.findOne({
      where: { id: dto.ocrVersionId },
      relations: ['document'],
    });
    if (!ocrVersion) {
      this.logger.error(`OCR版本不存在: ${dto.ocrVersionId}`);
      throw new NotFoundException('OCR版本不存在');
    }

    if (!ocrVersion.ocrText) {
      this.logger.warn(`OCR版本 ${dto.ocrVersionId} 没有OCR文本`);
      throw new BadRequestException('该OCR版本没有可脱敏的文本内容');
    }

    const rules = dto.rules || getDefaultRules();
    const result = desensitize(ocrVersion.ocrText, rules);

    const desensitizedVersion = new DesensitizedVersion();
    desensitizedVersion.ocrVersionId = dto.ocrVersionId;
    desensitizedVersion.desensitizedText = result.text;
    desensitizedVersion.desensitizationRules = result.rules as Record<string, boolean>;
    desensitizedVersion.desensitizedCount = result.count;
    desensitizedVersion.processedById = user.id;

    const savedVersion = await this.desensitizedVersionRepository.save(desensitizedVersion);
    this.logger.log(`脱敏版本创建成功, ID: ${savedVersion.id}, 处理 ${result.count} 处敏感信息`);

    return savedVersion;
  }

  async getDesensitizationHistory(ocrVersionId: number, user: User): Promise<DesensitizedVersion[]> {
    this.logger.debug(`用户 ${user.username} 查询OCR版本 ${ocrVersionId} 的脱敏历史`);

    const ocrVersion = await this.ocrVersionRepository.findOne({
      where: { id: ocrVersionId },
    });
    if (!ocrVersion) {
      this.logger.error(`OCR版本不存在: ${ocrVersionId}`);
      throw new NotFoundException('OCR版本不存在');
    }

    const history = await this.desensitizedVersionRepository.find({
      where: { ocrVersionId },
      relations: ['processedBy'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${history.length} 条脱敏历史记录`);
    return history;
  }

  async getDesensitizedVersion(id: number, user: User): Promise<DesensitizedVersion> {
    this.logger.debug(`用户 ${user.username} 查询脱敏版本详情: ${id}`);

    const version = await this.desensitizedVersionRepository.findOne({
      where: { id },
      relations: ['ocrVersion', 'processedBy', 'ocrVersion.document'],
    });
    if (!version) {
      this.logger.error(`脱敏版本不存在: ${id}`);
      throw new NotFoundException('脱敏版本不存在');
    }

    return version;
  }

  async deleteDesensitizedVersion(id: number, user: User): Promise<void> {
    this.logger.debug(`用户 ${user.username} 删除脱敏版本: ${id}`);

    const version = await this.desensitizedVersionRepository.findOne({
      where: { id },
    });
    if (!version) {
      this.logger.error(`脱敏版本不存在: ${id}`);
      throw new NotFoundException('脱敏版本不存在');
    }

    await this.desensitizedVersionRepository.delete(id);
    this.logger.log(`脱敏版本删除成功: ${id}`);
  }
}
