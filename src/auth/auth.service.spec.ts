import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const user = { id: 'u1', email: 'a@b.co' } as User;
  const usersService = {
    create: vi.fn(),
    validateCredentials: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn().mockResolvedValue('signed.jwt.token'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('signed.jwt.token');
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('login signs a token whose subject is the user id', async () => {
    usersService.validateCredentials.mockResolvedValue(user);

    const result = await service.login({ email: 'a@b.co', password: 'pw' });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@b.co',
    });
    expect(result).toEqual({ accessToken: 'signed.jwt.token', user });
  });

  it('login rejects invalid credentials without issuing a token', async () => {
    usersService.validateCredentials.mockResolvedValue(null);

    await expect(
      service.login({ email: 'a@b.co', password: 'bad' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('register creates the user and returns a token', async () => {
    usersService.create.mockResolvedValue(user);

    const result = await service.register({
      name: 'Alice',
      email: 'a@b.co',
      password: 'pw-12345678',
    });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user).toBe(user);
  });
});
