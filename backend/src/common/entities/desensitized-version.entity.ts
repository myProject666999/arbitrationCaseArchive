import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OcrVersion } from './ocr-version.entity';
import { User } from './user.entity';

@Entity('desensitized_versions')
export class DesensitizedVersion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'ocr_version_id' })
  ocrVersionId: number;

  @Column({ type: 'mediumtext', name: 'desensitized_text', nullable: true })
  desensitizedText: string;

  @Column({ type: 'json', name: 'desensitization_rules', nullable: true })
  desensitizationRules: Record<string, boolean>;

  @Column({ type: 'int', default: 0, name: 'desensitized_count' })
  desensitizedCount: number;

  @Column({ type: 'bigint', name: 'processed_by', nullable: true })
  processedById: number;

  @ManyToOne(() => OcrVersion, ocrVersion => ocrVersion.desensitizedVersions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ocr_version_id' })
  ocrVersion: OcrVersion;

  @ManyToOne(() => User, user => user.desensitizedVersions)
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
