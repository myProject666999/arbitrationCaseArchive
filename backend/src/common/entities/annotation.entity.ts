import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, VersionColumn } from 'typeorm';
import { Document } from './document.entity';
import { OcrVersion } from './ocr-version.entity';
import { User } from './user.entity';

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'document_id' })
  documentId: number;

  @Column({ type: 'bigint', name: 'ocr_version_id', nullable: true })
  ocrVersionId: number;

  @Column({ type: 'bigint', name: 'annotator_id' })
  annotatorId: number;

  @Column({ type: 'varchar', length: 50, name: 'annotation_type', nullable: true })
  annotationType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', name: 'page_position', nullable: true })
  pagePosition: Record<string, any>;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Document, document => document.annotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => OcrVersion, ocrVersion => ocrVersion.annotations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ocr_version_id' })
  ocrVersion: OcrVersion;

  @ManyToOne(() => User, user => user.annotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'annotator_id' })
  annotator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
