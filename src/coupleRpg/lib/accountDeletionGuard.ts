/** Skip logout storage cleanup while /api/account/delete is in flight. */
let inProgress = false;

export function setAccountDeletionInProgress(value: boolean): void {
  inProgress = value;
}

export function isAccountDeletionInProgress(): boolean {
  return inProgress;
}
