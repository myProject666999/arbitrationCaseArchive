import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: '密码（修改时使用）', example: '654321' })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ description: '旧密码', example: '123456' })
  @IsOptional()
  @IsString({ message: '旧密码必须是字符串' })
  oldPassword?: string;

  @ApiPropertyOptional({ description: '新密码', example: '654321' })
  @IsOptional()
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度不能少于6位' })
  newPassword: string;
}
