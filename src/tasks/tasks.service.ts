import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './entities/task.entity.js';

/** Every method is scoped to `ownerId`, so users only ever see their own tasks. */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: dto.title,
      done: dto.done,
      ownerId,
    });
    return this.tasksRepository.save(task);
  }

  findAll(ownerId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(ownerId: string, id: string): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, ownerId });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(ownerId, id);
    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const task = await this.findOne(ownerId, id);
    await this.tasksRepository.remove(task);
  }
}
