import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth/auth.guard.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}
  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.taskService.findOne(id);
  }
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body: CreateTaskDto) {
    const task = { title: body.title, done: body.done ?? false };

    return this.taskService.create(task);
  }
}
