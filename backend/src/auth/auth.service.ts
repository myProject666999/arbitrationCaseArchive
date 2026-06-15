import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../common/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    this.logger.debug(`用户尝试登录: ${loginDto.username}`);
    
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      this.logger.warn(`登录失败，用户不存在: ${loginDto.username}`);
      return { success: false, message: '用户名或密码错误' };
    }

    if (!user.isActive) {
      this.logger.warn(`登录失败，账号已禁用: ${loginDto.username}`);
      return { success: false, message: '账号已被禁用' };
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`登录失败，密码错误: ${loginDto.username}`);
      return { success: false, message: '用户名或密码错误' };
    }

    const payload = {
      userId: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);
    
    this.logger.log(`用户登录成功: ${user.username} (${user.realName})`);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        department: user.department,
        phone: user.phone,
      },
    };
  }

  async validateUser(userId: number) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }
}
