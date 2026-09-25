import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 20 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @OneToMany(() => Task, (task) => task.owner)
  tasks: Relation<Task[]>;
}
