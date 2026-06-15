import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Volume } from './volume.entity';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'case_number' })
  caseNumber: string;

  @Column({ type: 'varchar', length: 255, name: 'case_title' })
  caseTitle: string;

  @Column({ type: 'varchar', length: 50, name: 'case_type' })
  caseType: string;

  @Column({ type: 'varchar', length: 255, name: 'case_cause' })
  caseCause: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  applicant: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  respondent: string;

  @Column({ type: 'date', name: 'case_date', nullable: true })
  caseDate: Date;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_confidential' })
  isConfidential: boolean;

  @Column({ type: 'bigint', name: 'created_by', nullable: true })
  createdById: number;

  @ManyToOne(() => User, user => user.cases)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Volume, volume => volume.caseItem)
  volumes: Volume[];
}
