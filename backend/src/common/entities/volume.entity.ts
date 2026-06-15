import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Case } from './case.entity';
import { User } from './user.entity';
import { Document } from './document.entity';

@Entity('volumes')
export class Volume {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'case_id' })
  caseId: number;

  @Column({ type: 'int', name: 'volume_number' })
  volumeNumber: number;

  @Column({ type: 'varchar', length: 255, name: 'volume_name' })
  volumeName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0, name: 'page_count' })
  pageCount: number;

  @Column({ type: 'bigint', name: 'created_by', nullable: true })
  createdById: number;

  @ManyToOne(() => Case, caseItem => caseItem.volumes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  caseItem: Case;

  @ManyToOne(() => User, user => user.volumes)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Document, document => document.volume)
  documents: Document[];
}
