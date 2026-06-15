import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Document } from './document.entity';
import { User } from './user.entity';
import { DesensitizedVersion } from './desensitized-version.entity';
import { Annotation } from './annotation.entity';

@Entity('ocr_versions')
export class OcrVersion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'document_id' })
  documentId: number;

  @Column({ type: 'int', name: 'version_number' })
  versionNumber: number;

  @Column({ type: 'mediumtext', name: 'ocr_text', nullable: true })
  ocrText: string;

  @Column({ type: 'varchar', length: 50, name: 'ocr_engine', nullable: true })
  ocrEngine: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'confidence_score', nullable: true })
  confidenceScore: number;

  @Column({ type: 'tinyint', default: 0, name: 'is_incremental' })
  isIncremental: boolean;

  @Column({ type: 'text', name: 'incremental_changes', nullable: true })
  incrementalChanges: string;

  @Column({ type: 'bigint', name: 'processed_by', nullable: true })
  processedById: number;

  @Column({ type: 'datetime', name: 'processed_at', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;

  @ManyToOne(() => Document, document => document.ocrVersions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User, user => user.ocrVersions)
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => DesensitizedVersion, desensitizedVersion => desensitizedVersion.ocrVersion)
  desensitizedVersions: DesensitizedVersion[];

  @OneToMany(() => Annotation, annotation => annotation.ocrVersion)
  annotations: Annotation[];
}
