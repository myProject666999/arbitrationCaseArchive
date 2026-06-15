import { ConflictException } from '@nestjs/common';

export function checkVersion(currentVersion: number, expectedVersion: number): void {
  if (currentVersion !== expectedVersion) {
    throw new ConflictException('数据已被其他用户修改，请刷新后重试');
  }
}

export function incrementVersion(version: number): number {
  return version + 1;
}
