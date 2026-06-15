import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { Volume } from '../common/entities/volume.entity';
import { Case } from '../common/entities/case.entity';
import { Document } from '../common/entities/document.entity';
import { User } from '../common/entities/user.entity';

@Injectable()
export class VolumeService {
  private readonly logger = new Logger(VolumeService.name);

  constructor(
    @InjectRepository(Volume)
    private volumeRepository: Repository<Volume>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  async create(createVolumeDto: CreateVolumeDto, userId: number): Promise<Volume> {
    this.logger.debug(`创建卷册: ${JSON.stringify(createVolumeDto)}, 用户ID: ${userId}`);

    const caseItem = await this.caseRepository.findOne({
      where: { id: createVolumeDto.caseId },
    });
    if (!caseItem) {
      this.logger.error(`案件不存在: ${createVolumeDto.caseId}`);
      throw new BadRequestException('案件不存在');
    }

    const existingVolume = await this.volumeRepository.findOne({
      where: {
        caseId: createVolumeDto.caseId,
        volumeNumber: createVolumeDto.volumeNumber,
      },
    });
    if (existingVolume) {
      this.logger.error(`案件 ${createVolumeDto.caseId} 中卷册号 ${createVolumeDto.volumeNumber} 已存在`);
      throw new BadRequestException('该案件下的卷册号已存在');
    }

    const volume = this.volumeRepository.create({
      ...createVolumeDto,
      createdById: userId,
    });

    const savedVolume = await this.volumeRepository.save(volume);
    this.logger.log(`卷册创建成功: ${savedVolume.id}`);
    return savedVolume;
  }

  async findAll(page: number = 1, pageSize: number = 10): Promise<{ list: Volume[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`分页查询卷册列表: page=${page}, pageSize=${pageSize}`);

    const skip = (page - 1) * pageSize;
    const [list, total] = await this.volumeRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['caseItem', 'createdBy', 'documents'],
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<Volume> {
    this.logger.debug(`查询卷册详情: ${id}`);

    const volume = await this.volumeRepository.findOne({
      where: { id },
      relations: ['caseItem', 'createdBy', 'documents'],
    });

    if (!volume) {
      this.logger.error(`卷册不存在: ${id}`);
      throw new NotFoundException('卷册不存在');
    }

    return volume;
  }

  async findByCaseId(caseId: number): Promise<Volume[]> {
    this.logger.debug(`根据案件ID查询卷册列表: caseId=${caseId}`);

    const caseItem = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!caseItem) {
      this.logger.error(`案件不存在: ${caseId}`);
      throw new BadRequestException('案件不存在');
    }

    const volumes = await this.volumeRepository.find({
      where: { caseId },
      relations: ['createdBy', 'documents'],
      order: { volumeNumber: 'ASC' },
    });

    return volumes;
  }

  async update(id: number, updateVolumeDto: UpdateVolumeDto): Promise<Volume> {
    this.logger.debug(`更新卷册: ${id}, ${JSON.stringify(updateVolumeDto)}`);

    const volume = await this.volumeRepository.findOne({
      where: { id },
    });

    if (!volume) {
      this.logger.error(`卷册不存在: ${id}`);
      throw new NotFoundException('卷册不存在');
    }

    if (updateVolumeDto.caseId && updateVolumeDto.caseId !== volume.caseId) {
      const caseItem = await this.caseRepository.findOne({
        where: { id: updateVolumeDto.caseId },
      });
      if (!caseItem) {
        this.logger.error(`案件不存在: ${updateVolumeDto.caseId}`);
        throw new BadRequestException('案件不存在');
      }
    }

    if (updateVolumeDto.volumeNumber && updateVolumeDto.volumeNumber !== volume.volumeNumber) {
      const caseIdToCheck = updateVolumeDto.caseId || volume.caseId;
      const existingVolume = await this.volumeRepository.findOne({
        where: {
          caseId: caseIdToCheck,
          volumeNumber: updateVolumeDto.volumeNumber,
        },
      });
      if (existingVolume && existingVolume.id !== id) {
        this.logger.error(`案件 ${caseIdToCheck} 中卷册号 ${updateVolumeDto.volumeNumber} 已存在`);
        throw new BadRequestException('该案件下的卷册号已存在');
      }
    }

    Object.assign(volume, updateVolumeDto);
    const updatedVolume = await this.volumeRepository.save(volume);
    this.logger.log(`卷册更新成功: ${id}`);
    return updatedVolume;
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`删除卷册: ${id}`);

    const volume = await this.volumeRepository.findOne({
      where: { id },
    });

    if (!volume) {
      this.logger.error(`卷册不存在: ${id}`);
      throw new NotFoundException('卷册不存在');
    }

    await this.volumeRepository.remove(volume);
    this.logger.log(`卷册删除成功: ${id}`);
  }
}
