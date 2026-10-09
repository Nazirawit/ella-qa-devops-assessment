import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiResponse } from 'src/constants';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<ApiResponse<User>> {
    return this.usersService.create(dto);
  }

  @Get()
  async findAll(): Promise<ApiResponse<User[]>> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    return this.usersService.findOne(Number(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateUserDto,
  ): Promise<ApiResponse<User>> {
    return this.usersService.update(Number(id), dto);
  }
}
