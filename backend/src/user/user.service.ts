import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { User } from '../common/entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(`创建用户: ${createUserDto.username}`);

    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      this.logger.error(`用户名已存在: ${createUserDto.username}`);
      throw new BadRequestException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds);

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.passwordHash;
    this.logger.log(`用户创建成功: ${savedUser.id} - ${savedUser.username}`);

    return savedUser;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: User[]; total: number; page: number; pageSize: number }> {
    this.logger.debug(`分页查询用户, 页码: ${page}, 每页数量: ${pageSize}`);

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.userRepository.findAndCount({
      skip,
      take: pageSize,
      select: ['id', 'username', 'realName', 'role', 'department', 'phone', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`查询到 ${items.length} 条用户记录, 总计: ${total}`);
    return { items, total, page, pageSize };
  }

  async findOne(id: number): Promise<User> {
    this.logger.debug(`查询用户详情: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'realName', 'role', 'department', 'phone', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      this.logger.error(`用户不存在: ${id}`);
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.debug(`更新用户: ${id}`);

    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        this.logger.error(`用户名已存在: ${updateUserDto.username}`);
        throw new BadRequestException('用户名已存在');
      }
    }

    const { password, ...rest } = updateUserDto;
    const updateData: Partial<User> = { ...rest };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, this.saltRounds);
    }

    await this.userRepository.update(id, updateData);

    const updatedUser = await this.findOne(id);
    this.logger.log(`用户更新成功: ${id}`);

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`删除用户: ${id}`);

    const user = await this.findOne(id);

    if (user.role === 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) {
        throw new BadRequestException('至少需要保留一个启用的管理员账户');
      }
    }

    await this.userRepository.delete(id);
    this.logger.log(`用户删除成功: ${id}`);
  }

  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
    currentUser: User,
  ): Promise<void> {
    this.logger.debug(`修改用户密码: ${id}, 操作人: ${currentUser.username}`);

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`用户不存在: ${id}`);
      throw new NotFoundException('用户不存在');
    }

    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new ForbiddenException('无权修改其他用户密码');
    }

    if (currentUser.id === id && changePasswordDto.oldPassword) {
      const isOldPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);
      if (!isOldPasswordValid) {
        throw new BadRequestException('旧密码不正确');
      }
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, this.saltRounds);
    await this.userRepository.update(id, { passwordHash: newPasswordHash });

    this.logger.log(`用户密码修改成功: ${id}`);
  }

  async toggleStatus(id: number): Promise<User> {
    this.logger.debug(`切换用户状态: ${id}`);

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`用户不存在: ${id}`);
      throw new NotFoundException('用户不存在');
    }

    if (user.role === 'admin' && user.isActive) {
      const adminCount = await this.userRepository.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) {
        throw new BadRequestException('至少需要保留一个启用的管理员账户');
      }
    }

    await this.userRepository.update(id, { isActive: !user.isActive });

    const updatedUser = await this.findOne(id);
    this.logger.log(`用户状态切换成功: ${id}, 新状态: ${updatedUser.isActive ? '启用' : '禁用'}`);

    return updatedUser;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }
}
