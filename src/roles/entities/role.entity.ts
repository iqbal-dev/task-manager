import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Permission } from '../permission.enum.js';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  permissions: Permission[];
}
