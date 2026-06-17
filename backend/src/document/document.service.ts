import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from '../common/entities/document.entity';
import { Volume } from '../common/entities/volume.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { User } from '../common/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Volume)
    private volumeRepository: Repository<Volume>,
    @InjectRepository(OcrVersion)
    private ocrVersionRepository: Repository<OcrVersion>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, user: User): Promise<Document> {
    this.logger.debug(`创建文件: ${createDocumentDto.documentName}, 用户: ${user.username}`);

    const volume = await this.volumeRepository.findOne({
      where: { id: createDocumentDto.volumeId },
    });
    if (!volume) {
      this.logger.error(`卷册不存在: ${createDocumentDto.volumeId}`);
      throw new BadRequestException('卷册不存在');
    }

    const document = this.documentRepository.create({
      ...createDocumentDto,
      scanDate: createDocumentDto.scanDate ? new Date(createDocumentDto.scanDate) : null,
      createdById: user.id,
    });

    const savedDocument = await this.documentRepository.save(document);
    this.logger.log(`文件创建成功: ${savedDocument.id} - ${savedDocument.documentName}`);

    return savedDocument;
  }

  async findAll(page: number = 1, pageSize: number = 10): Promise<{ items: Document[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`分页查询文件, 页码: ${page}, 每页数量: ${pageSize}`);

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.documentRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['volume', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条文件记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async findOne(id: number): Promise<Document> {
    this.logger.debug(`查询文件详情: ${id}`);

    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['volume', 'createdBy', 'ocrVersions'],
    });

    if (!document) {
      this.logger.error(`文件不存在: ${id}`);
      throw new NotFoundException('文件不存在');
    }

    return document;
  }

  async findByVolumeId(volumeId: number): Promise<Document[]> {
    this.logger.debug(`根据卷册ID查询文件: ${volumeId}`);

    const volume = await this.volumeRepository.findOne({ where: { id: volumeId } });
    if (!volume) {
      this.logger.error(`卷册不存在: ${volumeId}`);
      throw new BadRequestException('卷册不存在');
    }

    const documents = await this.documentRepository.find({
      where: { volumeId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`卷册 ${volumeId} 下有 ${documents.length} 个文件`);
    return documents;
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    this.logger.debug(`更新文件: ${id}`);

    const document = await this.findOne(id);

    const { scanDate, ...rest } = updateDocumentDto;
    const updateData: Partial<Document> = { ...rest };
    if (scanDate) {
      updateData.scanDate = new Date(scanDate);
    }

    await this.documentRepository.update(id, updateData);

    const updatedDocument = await this.findOne(id);
    this.logger.log(`文件更新成功: ${id}`);

    return updatedDocument;
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`删除文件: ${id}`);

    const document = await this.findOne(id);

    if (document.filePath) {
      const fullPath = path.join(process.cwd(), document.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.debug(`删除物理文件: ${fullPath}`);
      }
    }

    await this.documentRepository.delete(id);
    this.logger.log(`文件删除成功: ${id}`);
  }

  async uploadDocument(file: Express.Multer.File, volumeId: number, user: User): Promise<Document> {
    this.logger.debug(`上传文件: ${file.originalname}, 卷册ID: ${volumeId}, 用户: ${user.username}`);

    const volume = await this.volumeRepository.findOne({ where: { id: volumeId } });
    if (!volume) {
      this.logger.error(`卷册不存在: ${volumeId}`);
      throw new BadRequestException('卷册不存在');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const fileName = `${timestamp}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.debug(`文件保存到: ${filePath}`);

    const relativePath = path.join('uploads', 'documents', fileName).replace(/\\/g, '/');

    const document = this.documentRepository.create({
      volumeId,
      documentName: file.originalname,
      documentType: ext.substring(1).toLowerCase(),
      filePath: relativePath,
      fileSize: file.size,
      ocrStatus: 'pending',
      createdById: user.id,
    });

    const savedDocument = await this.documentRepository.save(document);
    this.logger.log(`文件上传成功: ${savedDocument.id} - ${savedDocument.documentName}`);

    return savedDocument;
  }
}
