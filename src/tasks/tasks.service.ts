import { Injectable, NotFoundException } from '@nestjs/common';
export interface Task {
  id: number;
  title: string;
  done: boolean;
}
@Injectable()
export class TasksService {
  private tasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      done: true,
    },
  ];
  findAll(): Task[] {
    return this.tasks;
  }

  findOne(id: string): Task {
    const task = this.tasks.find((task) => task.id === parseInt(id));
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(body: { title: string; done?: boolean }): Task {
    const task = {
      id: this.tasks.length + 1,
      title: body.title,
      done: body.done ?? false,
    };
    this.tasks.push(task);
    return task;
  }
}
