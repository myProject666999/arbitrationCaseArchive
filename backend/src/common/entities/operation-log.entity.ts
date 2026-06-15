import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', nullable: true })
  userId: number;

  @Column({ type: 'varchar', length: 50, name: 'operation_type' })
  operationType: string;

  @Column({ type: 'varchar', length: 50, name: 'target_type', nullable: true })
  targetType: string;

  @Column({ type: 'bigint', name: 'target_id', nullable: true })
  targetId: number;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', length: 50, name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, name: 'user_agent', nullable: true })
  userAgent: string;

  @ManyToOne(() => User, user => user.operationLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
