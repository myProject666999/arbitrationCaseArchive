import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from './document.entity';
import { User } from './user.entity';

export type BorrowType = 'view' | 'download' | 'export';
export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'lost';

@Entity('borrow_records')
export class BorrowRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'document_id' })
  documentId: number;

  @Column({ type: 'bigint', name: 'applicant_id' })
  applicantId: number;

  @Column({ type: 'bigint', name: 'approver_id', nullable: true })
  approverId: number;

  @Column({ type: 'text', name: 'borrow_reason', nullable: true })
  borrowReason: string;

  @Column({
    type: 'enum',
    enum: ['view', 'download', 'export'],
    default: 'view',
    name: 'borrow_type',
  })
  borrowType: BorrowType;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'returned', 'overdue', 'lost'],
    default: 'pending',
  })
  status: BorrowStatus;

  @Column({ type: 'date', name: 'borrow_date', nullable: true })
  borrowDate: Date;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', name: 'return_date', nullable: true })
  returnDate: Date;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_reminded' })
  isReminded: boolean;

  @Column({ type: 'int', default: 0, name: 'reminder_count' })
  reminderCount: number;

  @Column({ type: 'datetime', name: 'last_reminder_at', nullable: true })
  lastReminderAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'compensation_amount' })
  compensationAmount: number;

  @ManyToOne(() => Document, document => document.borrowRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User, user => user.borrowApplications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @ManyToOne(() => User, user => user.borrowApprovals)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
