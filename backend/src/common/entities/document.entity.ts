import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, VersionColumn } from 'typeorm';
import { Volume } from './volume.entity';
import { User } from './user.entity';
import { OcrVersion } from './ocr-version.entity';
import { BorrowRecord } from './borrow-record.entity';
import { Annotation } from './annotation.entity';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'volume_id' })
  volumeId: number;

  @Column({ type: 'varchar', length: 255, name: 'document_name' })
  documentName: string;

  @Column({ type: 'varchar', length: 50, name: 'document_type', nullable: true })
  documentType: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path', nullable: true })
  filePath: string;

  @Column({ type: 'bigint', name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ type: 'int', name: 'page_number', nullable: true })
  pageNumber: number;

  @Column({ type: 'date', name: 'scan_date', nullable: true })
  scanDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    name: 'ocr_status',
  })
  ocrStatus: OcrStatus;

  @Column({ type: 'bigint', name: 'latest_ocr_version_id', nullable: true })
  latestOcrVersionId: number;

  @VersionColumn()
  version: number;

  @Column({ type: 'bigint', name: 'created_by', nullable: true })
  createdById: number;

  @ManyToOne(() => Volume, volume => volume.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volume_id' })
  volume: Volume;

  @ManyToOne(() => User, user => user.documents)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OcrVersion, ocrVersion => ocrVersion.document)
  ocrVersions: OcrVersion[];

  @OneToMany(() => BorrowRecord, borrowRecord => borrowRecord.document)
  borrowRecords: BorrowRecord[];

  @OneToMany(() => Annotation, annotation => annotation.document)
  annotations: Annotation[];
}
