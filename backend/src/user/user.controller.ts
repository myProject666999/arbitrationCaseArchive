import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Logger, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10', example: 10 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 10,
  ) {
    this.logger.debug(`分页查询用户, page: ${page}, pageSize: ${pageSize}`);
    const result = await this.userService.findAll(page, pageSize);
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '根据ID查询用户详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`查询用户详情: ${id}`);
    const user = await this.userService.findOne(id);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.debug(`创建用户: ${createUserDto.username}`);
    const user = await this.userService.create(createUserDto);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.logger.debug(`更新用户: ${id}`);
    const user = await this.userService.update(id, updateUserDto);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`删除用户: ${id}`);
    await this.userService.remove(id);
    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    this.logger.debug(`修改用户密码: ${id}, 操作人: ${currentUser.username}`);
    await this.userService.changePassword(id, changePasswordDto, currentUser);
    return {
      code: 200,
      message: '密码修改成功',
      data: null,
    };
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  @ApiOperation({ summary: '启用/禁用用户' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`切换用户状态: ${id}`);
    const user = await this.userService.toggleStatus(id);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }
}
