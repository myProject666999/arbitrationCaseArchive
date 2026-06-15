import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../common/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;

  @ApiProperty({ description: '真实姓名', example: '张三' })
  @IsNotEmpty({ message: '真实姓名不能为空' })
  @IsString({ message: '真实姓名必须是字符串' })
  realName: string;

  @ApiProperty({ description: '角色', enum: ['admin', 'librarian', 'user'], example: 'user' })
  @IsNotEmpty({ message: '角色不能为空' })
  @IsEnum(['admin', 'librarian', 'user'], { message: '角色不正确' })
  role: UserRole;

  @ApiPropertyOptional({ description: '部门', example: '技术部' })
  @IsOptional()
  @IsString({ message: '部门必须是字符串' })
  department?: string;

  @ApiPropertyOptional({ description: '电话', example: '13800138000' })
  @IsOptional()
  @IsString({ message: '电话必须是字符串' })
  phone?: string;
}
