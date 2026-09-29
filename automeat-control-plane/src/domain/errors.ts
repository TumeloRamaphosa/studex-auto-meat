import type { ApprovalActionType, CashClawState } from './types';

export class InvalidTransitionError extends Error {
  readonly code = 'INVALID_TRANSITION' as const;
  constructor(
    public readonly from: CashClawState,
    public readonly to: CashClawState,
  ) {
    super(`Invalid CashClaw transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class ActionBlockedError extends Error {
  readonly code = 'ACTION_BLOCKED' as const;
  constructor(
    public readonly actionType: ApprovalActionType,
    public readonly missionId: string,
    public readonly reason: string,
  ) {
    super(`Action ${actionType} blocked for mission ${missionId}: ${reason}`);
    this.name = 'ActionBlockedError';
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
