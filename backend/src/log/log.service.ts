import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OperationLog } from '../common/entities/operation-log.entity';
import { User } from '../common/entities/user.entity';

export interface CreateLogDto {
  operationType: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogQueryParams {
  userId?: number;
  operationType?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  async createLog(createLogDto: CreateLogDto, user?: User): Promise<OperationLog> {
    this.logger.debug(`记录操作日志: ${createLogDto.operationType}`);

    const log = this.operationLogRepository.create({
      ...createLogDto,
      userId: user?.id,
    });

    const savedLog = await this.operationLogRepository.save(log);
    this.logger.debug(`操作日志记录成功: ${savedLog.id}`);

    return savedLog;
  }

  async findAll(params: LogQueryParams): Promise<{
    items: OperationLog[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    this.logger.debug(
      `查询操作日志, page: ${page}, pageSize: ${pageSize}, userId: ${params.userId}, operationType: ${params.operationType}`,
    );

    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.operationType) {
      where.operationType = params.operationType;
    }

    if (params.startTime && params.endTime) {
      where.createdAt = Between(
        new Date(params.startTime),
        new Date(params.endTime),
      );
    }

    const [items, total] = await this.operationLogRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条日志记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }
}
