import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns ok when database is reachable', async () => {
    const result = await controller.check();
    expect(result).toMatchObject({
      status: 'ok',
      services: { database: 'up' },
    });
    expect(result.timestamp).toBeDefined();
  });

  it('returns degraded when database is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    const result = await controller.check();
    expect(result).toMatchObject({
      status: 'degraded',
      services: { database: 'down' },
    });
  });
});
