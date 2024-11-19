import { ClaimData } from 'src/types/claim-data';
type CountPayload = {
  count: number;
};
type UpdateResult = Promise<CountPayload>;
export interface ClaimRepositoryInterface {
  getIdleClaims(): Promise<ClaimData[]>;
  updateStaleInProgressToIdle(): UpdateResult;
  updateExpiredRetryToIdle(): UpdateResult;
  updateInProgressToIdle(args: {
    claimId: string;
    step: number;
    fallback: boolean;
  }): Promise<void>;
  updateInProgressToRetry(claimId: string): Promise<void>;
  updateInProgressToFail(claimId: string): Promise<void>;
  updateInProgressToSuccess(claimId: string): Promise<void>;
}
