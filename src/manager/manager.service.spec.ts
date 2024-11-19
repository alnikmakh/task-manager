import { Test, TestingModule } from '@nestjs/testing';
import { ManagerService } from './manager.service';
import { WorkerResponse } from './manager.service';
import { ClaimData } from 'src/types/claim-data';
import { ClaimRepositoryInterface } from 'src/types/claim.repository.interface';
import { ClaimRepository } from 'src/prisma/claim.repository';

global.fetch = jest.fn();

describe('ManagerService', () => {
  let service: ManagerService;
  let claimRepository: jest.Mocked<ClaimRepositoryInterface>;

  const mockClaims: ClaimData[] = [
    {
      id: '1',
      fallback: false,
      payload: 'test',
      currentScenarioStep: 0,
      scenario: 'test',
    },
    {
      id: '1',
      fallback: false,
      payload: 'test',
      currentScenarioStep: 0,
      scenario: 'test',
    },
  ];

  beforeEach(async () => {
    const mockClaimRepository: ClaimRepositoryInterface = {
      getIdleClaims: jest.fn(),
      updateStaleInProgressToIdle: jest.fn(),
      updateExpiredRetryToIdle: jest.fn(),
      updateInProgressToIdle: jest.fn(),
      updateInProgressToRetry: jest.fn(),
      updateInProgressToFail: jest.fn(),
      updateInProgressToSuccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagerService,
        {
          provide: ClaimRepository,
          useValue: mockClaimRepository,
        },
      ],
    }).compile();

    service = module.get<ManagerService>(ManagerService);
    claimRepository = module.get(ClaimRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startClaimRetrievingLoop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retrieve and send claims in a loop', async () => {
      claimRepository.getIdleClaims.mockResolvedValueOnce(mockClaims);
      (global.fetch as jest.Mock).mockResolvedValueOnce({});

      service.startClaimRetrievingLoop();

      await jest.advanceTimersByTimeAsync(100);

      service.loopActive = false;

      expect(claimRepository.getIdleClaims).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should update stale and expired claims', async () => {
    const mockUpdateResult = { count: 5 };
    claimRepository.updateStaleInProgressToIdle.mockResolvedValue(
      mockUpdateResult,
    );
    claimRepository.updateExpiredRetryToIdle.mockResolvedValue(
      mockUpdateResult,
    );

    await service.sanitize();

    expect(claimRepository.updateStaleInProgressToIdle).toHaveBeenCalled();
    expect(claimRepository.updateExpiredRetryToIdle).toHaveBeenCalled();
  });

  it('should handle worker response with NEXT status', async () => {
    const workerResponse: WorkerResponse = {
      claimId: '1',
      status: 'NEXT',
      nextStep: 2,
    };

    await service.processWorkerResponse(workerResponse);

    expect(claimRepository.updateInProgressToIdle).toHaveBeenCalledWith({
      claimId: '1',
      step: 2,
      fallback: false,
    });
  });

  it('should handle worker response with PREV status', async () => {
    const workerResponse: WorkerResponse = {
      claimId: '1',
      status: 'PREV',
      nextStep: 1,
    };

    await service.processWorkerResponse(workerResponse);

    expect(claimRepository.updateInProgressToIdle).toHaveBeenCalledWith({
      claimId: workerResponse.claimId,
      step: workerResponse.nextStep,
      fallback: true,
    });
  });

  it('should handle worker response with RETRY status', async () => {
    const workerResponse: WorkerResponse = {
      claimId: '1',
      status: 'RETRY',
    };

    await service.processWorkerResponse(workerResponse);

    expect(claimRepository.updateInProgressToRetry).toHaveBeenCalledWith(
      workerResponse.claimId,
    );
  });

  it('should handle worker response with FAIL status', async () => {
    const workerResponse: WorkerResponse = {
      claimId: '1',
      status: 'FAIL',
    };

    await service.processWorkerResponse(workerResponse);

    expect(claimRepository.updateInProgressToFail).toHaveBeenCalledWith(
      workerResponse.claimId,
    );
  });

  it('should handle worker response with SUCCESS status', async () => {
    const workerResponse: WorkerResponse = {
      claimId: '1',
      status: 'SUCCESS',
    };

    await service.processWorkerResponse(workerResponse);

    expect(claimRepository.updateInProgressToSuccess).toHaveBeenCalledWith(
      workerResponse.claimId,
    );
  });

  it('should send claims to worker endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({});

    await service.sendClaimsToWorker(mockClaims);

    expect(global.fetch).toHaveBeenCalled();
  });
});
