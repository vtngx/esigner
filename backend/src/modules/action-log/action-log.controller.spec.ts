import { Test, TestingModule } from '@nestjs/testing';
import { ActionLogController } from './action-log.controller';
import { ActionLogService } from './action-log.service';

describe('ActionLogController', () => {
  let controller: ActionLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionLogController],
      providers: [ActionLogService],
    }).compile();

    controller = module.get<ActionLogController>(ActionLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
