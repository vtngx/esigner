import { Test, TestingModule } from '@nestjs/testing';
import { PdfExportController } from './pdf-export.controller';
import { PdfExportService } from './pdf-export.service';

describe('PdfExportController', () => {
  let controller: PdfExportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfExportController],
      providers: [PdfExportService],
    }).compile();

    controller = module.get<PdfExportController>(PdfExportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
