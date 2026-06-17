import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ApproveBorrowDto } from './dto/approve-borrow.dto';
import { ReturnBorrowDto } from './dto/return-borrow.dto';
import { RejectBorrowDto } from './dto/reject-borrow.dto';
import { BorrowRecord, BorrowStatus } from '../common/entities/borrow-record.entity';
import { Document } from '../common/entities/document.entity';
import { User, UserRole } from '../common/entities/user.entity';

@Injectable()
export class BorrowService {
  private readonly logger = new Logger(BorrowService.name);

  constructor(
    @InjectRepository(BorrowRecord)
    private borrowRepository: Repository<BorrowRecord>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async applyBorrow(createBorrowDto: CreateBorrowDto, user: User): Promise<BorrowRecord> {
    this.logger.debug(`申请借阅, 用户: ${user.username}, 文件ID: ${createBorrowDto.documentId}`);

    const document = await this.documentRepository.findOne({
      where: { id: createBorrowDto.documentId },
    });
    if (!document) {
      this.logger.error(`文件不存在: ${createBorrowDto.documentId}`);
      throw new BadRequestException('文件不存在');
    }

    const borrowDate = new Date(createBorrowDto.borrowDate);
    const dueDate = new Date(createBorrowDto.dueDate);

    if (dueDate <= borrowDate) {
      this.logger.error(`归还日期必须晚于借阅日期`);
      throw new BadRequestException('归还日期必须晚于借阅日期');
    }

    const existingBorrow = await this.borrowRepository.findOne({
      where: {
        documentId: createBorrowDto.documentId,
        applicantId: user.id,
        status: In(['pending', 'approved']),
      },
    });

    if (existingBorrow) {
      this.logger.error(`用户已申请借阅该文件，当前状态: ${existingBorrow.status}`);
      throw new BadRequestException('您已申请借阅该文件，请等待审批或归还后再申请');
    }

    const borrowRecord = this.borrowRepository.create({
      ...createBorrowDto,
      borrowDate,
      dueDate,
      applicantId: user.id,
      status: 'pending',
      isReminded: false,
      reminderCount: 0,
    });

    const savedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅申请创建成功: ${savedRecord.id}, 用户: ${user.username}, 文件: ${document.documentName}`);

    return this.findOne(savedRecord.id);
  }

  async approveBorrow(id: number, approveBorrowDto: ApproveBorrowDto, approver: User): Promise<BorrowRecord> {
    this.logger.debug(`审批借阅通过, 借阅ID: ${id}, 审批人: ${approver.username}`);

    const borrowRecord = await this.findOne(id);

    if (borrowRecord.status !== 'pending') {
      this.logger.error(`借阅状态不是待审批状态: ${borrowRecord.status}`);
      throw new BadRequestException('该借阅申请已处理，无法重复审批');
    }

    borrowRecord.status = 'approved';
    borrowRecord.approverId = approver.id;

    const updatedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅审批通过: ${id}, 审批人: ${approver.username}`);

    return this.findOne(updatedRecord.id);
  }

  async rejectBorrow(id: number, rejectBorrowDto: RejectBorrowDto, approver: User): Promise<BorrowRecord> {
    this.logger.debug(`审批借阅拒绝, 借阅ID: ${id}, 审批人: ${approver.username}`);

    const borrowRecord = await this.findOne(id);

    if (borrowRecord.status !== 'pending') {
      this.logger.error(`借阅状态不是待审批状态: ${borrowRecord.status}`);
      throw new BadRequestException('该借阅申请已处理，无法重复审批');
    }

    borrowRecord.status = 'rejected';
    borrowRecord.approverId = approver.id;
    borrowRecord.rejectionReason = rejectBorrowDto.rejectionReason;

    const updatedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅审批拒绝: ${id}, 审批人: ${approver.username}, 理由: ${rejectBorrowDto.rejectionReason}`);

    return this.findOne(updatedRecord.id);
  }

  async returnBorrow(id: number, returnBorrowDto: ReturnBorrowDto, user: User): Promise<BorrowRecord> {
    this.logger.debug(`归还借阅, 借阅ID: ${id}, 操作人: ${user.username}`);

    const borrowRecord = await this.findOne(id);

    if (!['approved', 'overdue'].includes(borrowRecord.status)) {
      this.logger.error(`借阅状态不允许归还: ${borrowRecord.status}`);
      throw new BadRequestException('只有已批准或已逾期的借阅才能归还');
    }

    borrowRecord.status = 'returned';
    borrowRecord.returnDate = returnBorrowDto.returnDate ? new Date(returnBorrowDto.returnDate) : new Date();

    const updatedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅归还成功: ${id}, 操作人: ${user.username}`);

    return this.findOne(updatedRecord.id);
  }

  async markAsLost(id: number, user: User): Promise<BorrowRecord> {
    this.logger.debug(`标记丢失, 借阅ID: ${id}, 操作人: ${user.username}`);

    const borrowRecord = await this.findOne(id);

    if (!['approved', 'overdue'].includes(borrowRecord.status)) {
      this.logger.error(`借阅状态不允许标记丢失: ${borrowRecord.status}`);
      throw new BadRequestException('只有已批准或已逾期的借阅才能标记丢失');
    }

    borrowRecord.status = 'lost';

    const updatedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅标记丢失成功: ${id}, 操作人: ${user.username}`);

    return this.findOne(updatedRecord.id);
  }

  async remindOverdue(id: number, user: User): Promise<BorrowRecord> {
    this.logger.debug(`催还借阅, 借阅ID: ${id}, 操作人: ${user.username}`);

    const borrowRecord = await this.findOne(id);

    if (borrowRecord.status !== 'overdue' && borrowRecord.status !== 'approved') {
      this.logger.error(`借阅状态不允许催还: ${borrowRecord.status}`);
      throw new BadRequestException('只有已批准或已逾期的借阅才能催还');
    }

    borrowRecord.isReminded = true;
    borrowRecord.reminderCount = (borrowRecord.reminderCount || 0) + 1;
    borrowRecord.lastReminderAt = new Date();

    const updatedRecord = await this.borrowRepository.save(borrowRecord);
    this.logger.log(`借阅催还成功: ${id}, 催还次数: ${updatedRecord.reminderCount}, 操作人: ${user.username}`);

    return this.findOne(updatedRecord.id);
  }

  async getOverdueList(): Promise<BorrowRecord[]> {
    this.logger.debug(`获取逾期列表`);

    const now = new Date();

    const overdueRecords = await this.borrowRepository.find({
      where: [
        { status: 'approved', dueDate: LessThan(now) },
        { status: 'overdue' },
      ],
      relations: ['document', 'applicant', 'approver'],
      order: { createdAt: 'DESC' },
    });

    for (const record of overdueRecords) {
      if (record.status === 'approved' && record.dueDate < now) {
        record.status = 'overdue';
        await this.borrowRepository.update(record.id, { status: 'overdue' });
      }
    }

    const result = await this.borrowRepository.find({
      where: { status: 'overdue' },
      relations: ['document', 'applicant', 'approver'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${result.length} 条逾期记录`);
    return result;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    user: User,
    status?: BorrowStatus,
    documentId?: number,
    applicantId?: number,
  ): Promise<{ items: BorrowRecord[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`分页查询借阅记录, page: ${page}, pageSize: ${pageSize}, 用户: ${user.username}`);

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (documentId) {
      where.documentId = documentId;
    }
    if (applicantId) {
      where.applicantId = applicantId;
    }

    if (user.role === 'user') {
      where.applicantId = user.id;
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.borrowRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      relations: ['document', 'applicant', 'approver'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条借阅记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async findOne(id: number, user?: User): Promise<BorrowRecord> {
    this.logger.debug(`查询借阅详情: ${id}`);

    const borrowRecord = await this.borrowRepository.findOne({
      where: { id },
      relations: ['document', 'applicant', 'approver'],
    });

    if (!borrowRecord) {
      this.logger.error(`借阅记录不存在: ${id}`);
      throw new NotFoundException('借阅记录不存在');
    }

    if (user && user.role === 'user' && borrowRecord.applicantId !== user.id) {
      this.logger.error(`用户 ${user.username} 无权限查看借阅记录: ${id}`);
      throw new ForbiddenException('无权限查看该借阅记录');
    }

    return borrowRecord;
  }

  async getMyBorrows(
    userId: number,
    page: number = 1,
    pageSize: number = 10,
    status?: BorrowStatus,
  ): Promise<{ items: BorrowRecord[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`获取用户借阅记录, userId: ${userId}, page: ${page}, pageSize: ${pageSize}`);

    const where: any = { applicantId: userId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.borrowRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      relations: ['document', 'applicant', 'approver'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条用户借阅记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async getPendingApprovals(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: BorrowRecord[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`获取待审批列表, page: ${page}, pageSize: ${pageSize}`);

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.borrowRepository.findAndCount({
      where: { status: 'pending' },
      skip,
      take: pageSize,
      relations: ['document', 'applicant'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条待审批记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async checkOverdue(): Promise<void> {
    this.logger.debug(`检查逾期借阅`);

    const now = new Date();
    const overdueRecords = await this.borrowRepository.find({
      where: {
        status: 'approved',
        dueDate: LessThan(now),
      },
    });

    for (const record of overdueRecords) {
      record.status = 'overdue';
      await this.borrowRepository.save(record);
      this.logger.log(`借阅 ${record.id} 已自动标记为逾期`);
    }

    this.logger.debug(`共处理 ${overdueRecords.length} 条逾期记录`);
  }
}
