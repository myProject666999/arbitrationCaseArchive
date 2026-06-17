import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { Annotation } from '../common/entities/annotation.entity';
import { Document } from '../common/entities/document.entity';
import { User } from '../common/entities/user.entity';
import { checkVersion } from '../common/utils/optimistic-lock.util';

@Injectable()
export class AnnotationService {
  private readonly logger = new Logger(AnnotationService.name);

  constructor(
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createAnnotationDto: CreateAnnotationDto, user: User): Promise<Annotation> {
    this.logger.debug(`创建标注, 用户: ${user.username}`);

    const document = await this.documentRepository.findOne({
      where: { id: createAnnotationDto.documentId },
    });
    if (!document) {
      this.logger.error(`文档不存在: ${createAnnotationDto.documentId}`);
      throw new BadRequestException('文档不存在');
    }

    const annotation = this.annotationRepository.create({
      ...createAnnotationDto,
      annotatorId: user.id,
    });

    const savedAnnotation = await this.annotationRepository.save(annotation);
    this.logger.log(`标注创建成功: ${savedAnnotation.id}`);

    return savedAnnotation;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: Annotation[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`分页查询标注, 页码: ${page}, 每页数量: ${pageSize}`);

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.annotationRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['document', 'annotator', 'ocrVersion'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条标注记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async findByDocumentId(documentId: number): Promise<Annotation[]> {
    this.logger.debug(`根据文档ID查询标注: ${documentId}`);

    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      this.logger.error(`文档不存在: ${documentId}`);
      throw new BadRequestException('文档不存在');
    }

    const annotations = await this.annotationRepository.find({
      where: { documentId },
      relations: ['annotator', 'ocrVersion'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`文档 ${documentId} 下有 ${annotations.length} 个标注`);
    return annotations;
  }

  async findOne(id: number): Promise<Annotation> {
    this.logger.debug(`查询标注详情: ${id}`);

    const annotation = await this.annotationRepository.findOne({
      where: { id },
      relations: ['document', 'annotator', 'ocrVersion'],
    });

    if (!annotation) {
      this.logger.error(`标注不存在: ${id}`);
      throw new NotFoundException('标注不存在');
    }

    return annotation;
  }

  async update(id: number, updateAnnotationDto: UpdateAnnotationDto): Promise<Annotation> {
    this.logger.debug(`更新标注: ${id}`);

    const annotation = await this.findOne(id);

    checkVersion(annotation.version, updateAnnotationDto.version);

    const { version, ...rest } = updateAnnotationDto;
    await this.annotationRepository.update(id, rest);

    const updatedAnnotation = await this.findOne(id);
    this.logger.log(`标注更新成功: ${id}`);

    return updatedAnnotation;
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`删除标注: ${id}`);

    const annotation = await this.findOne(id);

    await this.annotationRepository.delete(id);
    this.logger.log(`标注删除成功: ${id}`);
  }
}
