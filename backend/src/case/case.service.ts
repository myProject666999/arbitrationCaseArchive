import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../common/entities/case.entity';
import { Volume } from '../common/entities/volume.entity';
import { Document } from '../common/entities/document.entity';
import { User } from '../common/entities/user.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Volume)
    private volumeRepository: Repository<Volume>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createCaseDto: CreateCaseDto, userId: number) {
    this.logger.debug(`创建案件: ${createCaseDto.caseNumber}`);

    const existingCase = await this.caseRepository.findOne({
      where: { caseNumber: createCaseDto.caseNumber },
    });

    if (existingCase) {
      this.logger.warn(`案件编号已存在: ${createCaseDto.caseNumber}`);
      throw new ConflictException('案件编号已存在');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`用户不存在: ${userId}`);
      throw new NotFoundException('用户不存在');
    }

    const caseData = this.caseRepository.create({
      ...createCaseDto,
      caseDate: createCaseDto.caseDate ? new Date(createCaseDto.caseDate) : null,
      createdById: userId,
    });

    const savedCase = await this.caseRepository.save(caseData);
    this.logger.log(`案件创建成功: ${savedCase.id} - ${savedCase.caseNumber}`);

    return savedCase;
  }

  async findAll(page: number = 1, pageSize: number = 10, keyword?: string) {
    this.logger.debug(`分页查询案件, page: ${page}, pageSize: ${pageSize}, keyword: ${keyword || '无'}`);

    const queryBuilder = this.caseRepository
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.createdBy', 'user')
      .select([
        'case.id',
        'case.caseNumber',
        'case.caseTitle',
        'case.caseType',
        'case.caseCause',
        'case.applicant',
        'case.respondent',
        'case.caseDate',
        'case.isConfidential',
        'case.createdAt',
        'case.updatedAt',
        'user.id',
        'user.username',
        'user.realName',
      ]);

    if (keyword) {
      queryBuilder.where(
        'case.caseNumber LIKE :keyword OR case.caseTitle LIKE :keyword OR case.applicant LIKE :keyword OR case.respondent LIKE :keyword',
        { keyword: `%${keyword}%` },
      );
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await queryBuilder
      .orderBy('case.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    this.logger.debug(`查询到 ${total} 条案件记录`);

    return {
      items: list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    this.logger.debug(`获取案件详情: ${id}`);

    const caseData = await this.caseRepository
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.createdBy', 'creator')
      .leftJoinAndSelect('case.volumes', 'volumes')
      .leftJoinAndSelect('volumes.documents', 'documents')
      .leftJoinAndSelect('documents.createdBy', 'docCreator')
      .where('case.id = :id', { id })
      .select([
        'case.id',
        'case.caseNumber',
        'case.caseTitle',
        'case.caseType',
        'case.caseCause',
        'case.applicant',
        'case.respondent',
        'case.caseDate',
        'case.summary',
        'case.isConfidential',
        'case.createdAt',
        'case.updatedAt',
        'creator.id',
        'creator.username',
        'creator.realName',
        'volumes.id',
        'volumes.volumeNumber',
        'volumes.volumeName',
        'volumes.description',
        'volumes.pageCount',
        'volumes.createdAt',
        'documents.id',
        'documents.documentName',
        'documents.documentType',
        'documents.filePath',
        'documents.fileSize',
        'documents.pageNumber',
        'documents.ocrStatus',
        'documents.createdAt',
        'docCreator.id',
        'docCreator.username',
        'docCreator.realName',
      ])
      .getOne();

    if (!caseData) {
      this.logger.warn(`案件不存在: ${id}`);
      throw new NotFoundException('案件不存在');
    }

    this.logger.debug(`获取案件详情成功: ${caseData.caseNumber}`);
    return caseData;
  }

  async findByCaseNumber(caseNumber: string) {
    this.logger.debug(`根据案件编号查询: ${caseNumber}`);

    const caseData = await this.caseRepository
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.createdBy', 'creator')
      .leftJoinAndSelect('case.volumes', 'volumes')
      .leftJoinAndSelect('volumes.documents', 'documents')
      .leftJoinAndSelect('documents.createdBy', 'docCreator')
      .where('case.caseNumber = :caseNumber', { caseNumber })
      .select([
        'case.id',
        'case.caseNumber',
        'case.caseTitle',
        'case.caseType',
        'case.caseCause',
        'case.applicant',
        'case.respondent',
        'case.caseDate',
        'case.summary',
        'case.isConfidential',
        'case.createdAt',
        'case.updatedAt',
        'creator.id',
        'creator.username',
        'creator.realName',
        'volumes.id',
        'volumes.volumeNumber',
        'volumes.volumeName',
        'volumes.description',
        'volumes.pageCount',
        'volumes.createdAt',
        'documents.id',
        'documents.documentName',
        'documents.documentType',
        'documents.filePath',
        'documents.fileSize',
        'documents.pageNumber',
        'documents.ocrStatus',
        'documents.createdAt',
        'docCreator.id',
        'docCreator.username',
        'docCreator.realName',
      ])
      .getOne();

    if (!caseData) {
      this.logger.warn(`案件不存在: ${caseNumber}`);
      throw new NotFoundException('案件不存在');
    }

    this.logger.debug(`根据案件编号查询成功: ${caseNumber}`);
    return caseData;
  }

  async update(id: number, updateCaseDto: UpdateCaseDto) {
    this.logger.debug(`更新案件: ${id}`);

    const caseData = await this.caseRepository.findOne({ where: { id } });
    if (!caseData) {
      this.logger.warn(`案件不存在: ${id}`);
      throw new NotFoundException('案件不存在');
    }

    if (updateCaseDto.caseNumber && updateCaseDto.caseNumber !== caseData.caseNumber) {
      const existingCase = await this.caseRepository.findOne({
        where: { caseNumber: updateCaseDto.caseNumber },
      });
      if (existingCase) {
        this.logger.warn(`案件编号已存在: ${updateCaseDto.caseNumber}`);
        throw new ConflictException('案件编号已存在');
      }
    }

    const updateData: Partial<Case> = {};
    if (updateCaseDto.caseNumber !== undefined) updateData.caseNumber = updateCaseDto.caseNumber;
    if (updateCaseDto.caseTitle !== undefined) updateData.caseTitle = updateCaseDto.caseTitle;
    if (updateCaseDto.caseType !== undefined) updateData.caseType = updateCaseDto.caseType;
    if (updateCaseDto.caseCause !== undefined) updateData.caseCause = updateCaseDto.caseCause;
    if (updateCaseDto.applicant !== undefined) updateData.applicant = updateCaseDto.applicant;
    if (updateCaseDto.respondent !== undefined) updateData.respondent = updateCaseDto.respondent;
    if (updateCaseDto.caseDate !== undefined) updateData.caseDate = new Date(updateCaseDto.caseDate);
    if (updateCaseDto.summary !== undefined) updateData.summary = updateCaseDto.summary;
    if (updateCaseDto.isConfidential !== undefined) updateData.isConfidential = updateCaseDto.isConfidential;

    await this.caseRepository.update(id, updateData);
    const updatedCase = await this.caseRepository.findOne({ where: { id } });

    this.logger.log(`案件更新成功: ${id} - ${updatedCase.caseNumber}`);
    return updatedCase;
  }

  async remove(id: number) {
    this.logger.debug(`删除案件: ${id}`);

    const caseData = await this.caseRepository.findOne({ where: { id } });
    if (!caseData) {
      this.logger.warn(`案件不存在: ${id}`);
      throw new NotFoundException('案件不存在');
    }

    await this.caseRepository.delete(id);
    this.logger.log(`案件删除成功: ${id} - ${caseData.caseNumber}`);

    return { success: true };
  }
}
