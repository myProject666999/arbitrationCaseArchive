import { Controller, Post, Body, UseGuards, Request, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto) {
    this.logger.debug(`登录请求: ${loginDto.username}`);
    const result = await this.authService.login(loginDto);
    if (!result.success) {
      return {
        code: 401,
        message: result.message,
        data: null,
      };
    }
    return {
      code: 200,
      message: '登录成功',
      data: {
        token: result.token,
        user: result.user,
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  getProfile(@CurrentUser() user: any) {
    this.logger.debug(`获取用户信息: ${user.username}`);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  logout(@CurrentUser() user: any) {
    this.logger.log(`用户登出: ${user.username}`);
    return {
      code: 200,
      message: '登出成功',
      data: null,
    };
  }
}
