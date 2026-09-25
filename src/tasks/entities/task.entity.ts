import { Column, Entity, Index, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ default: false })
  done: boolean;

  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  owner: Relation<User>;
}
