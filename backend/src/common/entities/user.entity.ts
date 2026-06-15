import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Case } from './case.entity';
import { Volume } from './volume.entity';
import { Document } from './document.entity';
import { OcrVersion } from './ocr-version.entity';
import { BorrowRecord } from './borrow-record.entity';
import { DesensitizedVersion } from './desensitized-version.entity';
import { Annotation } from './annotation.entity';
import { OperationLog } from './operation-log.entity';

export type UserRole = 'admin' | 'librarian' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, name: 'real_name' })
  realName: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'librarian', 'user'],
    default: 'user',
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Case, caseItem => caseItem.createdBy)
  cases: Case[];

  @OneToMany(() => Volume, volume => volume.createdBy)
  volumes: Volume[];

  @OneToMany(() => Document, document => document.createdBy)
  documents: Document[];

  @OneToMany(() => OcrVersion, ocrVersion => ocrVersion.processedBy)
  ocrVersions: OcrVersion[];

  @OneToMany(() => BorrowRecord, borrowRecord => borrowRecord.applicant)
  borrowApplications: BorrowRecord[];

  @OneToMany(() => BorrowRecord, borrowRecord => borrowRecord.approver)
  borrowApprovals: BorrowRecord[];

  @OneToMany(() => DesensitizedVersion, desensitizedVersion => desensitizedVersion.processedBy)
  desensitizedVersions: DesensitizedVersion[];

  @OneToMany(() => Annotation, annotation => annotation.annotator)
  annotations: Annotation[];

  @OneToMany(() => OperationLog, operationLog => operationLog.user)
  operationLogs: OperationLog[];
}
