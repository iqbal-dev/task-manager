import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HashingService } from '../common/hashing/hashing.service.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    create: vi.fn((data: Partial<User>) => data as User),
    save: vi.fn((user: User) => Promise.resolve(user)),
    findOneBy: vi.fn(),
    find: vi.fn(),
    remove: vi.fn(),
  };
  const hashing = {
    hash: vi.fn((value: string) => Promise.resolve(`hashed:${value}`)),
    compare: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: HashingService, useValue: hashing },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'pw-12345678',
    };

    it('stores a hashed password, never the plain one', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const user = await service.create(dto);

      expect(hashing.hash).toHaveBeenCalledWith(dto.password);
      expect(user.password).toBe('hashed:pw-12345678');
    });

    it('rejects an email that is already registered', async () => {
      repository.findOneBy.mockResolvedValue({ id: '1' } as User);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('maps a unique-constraint race to a 409', async () => {
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockRejectedValueOnce({ code: '23505' });

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for an unknown id', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns null instead of throwing when nothing matches', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.findByEmail('nobody@example.com'),
      ).resolves.toBeNull();
    });
  });

  describe('validateCredentials', () => {
    const stored = { id: '1', email: 'a@b.co', password: 'hash' } as User;

    it('returns the user when the password matches', async () => {
      repository.findOneBy.mockResolvedValue(stored);
      hashing.compare.mockResolvedValue(true);

      await expect(service.validateCredentials('a@b.co', 'pw')).resolves.toBe(
        stored,
      );
    });

    it('returns null for a wrong password or unknown email', async () => {
      repository.findOneBy.mockResolvedValueOnce(stored);
      hashing.compare.mockResolvedValueOnce(false);
      await expect(
        service.validateCredentials('a@b.co', 'bad'),
      ).resolves.toBeNull();

      repository.findOneBy.mockResolvedValueOnce(null);
      await expect(
        service.validateCredentials('x@y.zz', 'pw'),
      ).resolves.toBeNull();
    });
  });
});
