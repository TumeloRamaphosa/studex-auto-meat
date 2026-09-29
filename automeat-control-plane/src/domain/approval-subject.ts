import type { ApprovalActionType } from './types';

/** Exact payload bound to an approval request (example values only). */
export type ApprovalSubjectByAction = {
  PRICE_CHANGE: { sku: string; newPriceZar: number };
  QUOTATION: { quoteRef: string; amountZar: number };
  PUBLISHING: { contentDraftId: string };
  CUSTOMER_MESSAGE: { messageId: string };
  FULFILLMENT: { fulfilmentRef: string };
  REFUND: { orderRef: string; refundAmountZar: number };
};

export type ApprovalSubject = {
  [K in ApprovalActionType]: { actionType: K } & ApprovalSubjectByAction[K];
}[ApprovalActionType];

export function subjectForAction<T extends ApprovalActionType>(
  actionType: T,
  payload: ApprovalSubjectByAction[T],
): Extract<ApprovalSubject, { actionType: T }> {
  return { actionType, ...payload } as unknown as Extract<ApprovalSubject, { actionType: T }>;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function parseApprovalSubjectJson(json: string): ApprovalSubject {
  const parsed = JSON.parse(json) as ApprovalSubject;
  if (!parsed || typeof parsed !== 'object' || !('actionType' in parsed)) {
    throw new Error('Invalid approval subject JSON');
  }
  return parsed;
}

export function serializeApprovalSubject(subject: ApprovalSubject): string {
  return JSON.stringify(subject);
}

export function approvalSubjectsMatch(
  stored: ApprovalSubject,
  requested: ApprovalSubject,
): boolean {
  if (stored.actionType !== requested.actionType) {
    return false;
  }
  return canonicalize(stored) === canonicalize(requested);
}

export function subjectsMatchForAction(
  actionType: ApprovalActionType,
  storedJson: string,
  requested: ApprovalSubjectByAction[ApprovalActionType],
): boolean {
  const stored = parseApprovalSubjectJson(storedJson);
  if (stored.actionType !== actionType) {
    return false;
  }
  const requestedFull = subjectForAction(actionType, requested as ApprovalSubjectByAction[typeof actionType]);
  return approvalSubjectsMatch(stored, requestedFull);
}
