import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService Unit Tests', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    transactions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create()', () => {
    it('should successfully create and return a new user', async () => {
      const dto = { name: 'John Doe', email: 'john@example.com' };
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        data: mockUser,
      });
    });

    it('BUG-03: returns 201 with id 0 when duplicate email error occurs (Defect behavior)', async () => {
      const dto = { name: 'Duplicate User', email: 'john@example.com' };
      const duplicateError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (duplicateError as any).code = '23505';

      mockRepository.create.mockReturnValue({ ...dto } as any);
      mockRepository.save.mockRejectedValue(duplicateError);

      const result = await service.create(dto);

      // Verifying BUG-03: the service returns 201 with dummy id 0 instead of throwing ConflictException
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data?.id).toBe(0);
      expect(result.data?.email).toBe(dto.email);
    });

    it('should throw InternalServerError when an unexpected database error occurs', async () => {
      const dto = { name: 'Fail User', email: 'fail@example.com' };
      mockRepository.create.mockReturnValue({ ...dto } as any);
      mockRepository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(service.create(dto)).rejects.toThrow();
    });
  });

  describe('findAll()', () => {
    it('should return an array of users with transactions relation', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['transactions'],
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Users retrieved successfully',
        data: [mockUser],
      });
    });

    it('should throw InternalServerError if repository find fails', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB failure'));

      await expect(service.findAll()).rejects.toThrow();
    });
  });

  describe('findOne()', () => {
    it('should return a user if found by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User retrieved successfully',
        data: mockUser,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should successfully update and return the user', async () => {
      const updateDto = { name: 'Updated Name', email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockRepository.preload.mockResolvedValue(updatedUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...updateDto,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: updatedUser,
      });
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      mockRepository.preload.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Ghost', email: 'ghost@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated email already exists (code 23505)', async () => {
      const updateDto = { name: 'Duplicate', email: 'existing@example.com' };
      const duplicateError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (duplicateError as any).code = '23505';

      mockRepository.preload.mockResolvedValue({ id: 1, ...updateDto } as any);
      mockRepository.save.mockRejectedValue(duplicateError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
