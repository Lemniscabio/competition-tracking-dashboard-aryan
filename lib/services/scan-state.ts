// In-memory scan status, shared across requests on the same server instance.
// Lets the UI reflect a running scan across navigation/reloads without a DB
// migration. Single-user tool: the trigger and status polls hit the same warm
// Cloud Run instance, so module-level state is sufficient.

export interface ScanState {
  status: 'idle' | 'running';
  startedAt: string | null;
  finishedAt: string | null;
  total: number;
  completed: number;
  newSignals: number;
  error: string | null;
}

const IDLE: ScanState = {
  status: 'idle',
  startedAt: null,
  finishedAt: null,
  total: 0,
  completed: 0,
  newSignals: 0,
  error: null,
};

let state: ScanState = { ...IDLE };

export function getScanState(): ScanState {
  return { ...state };
}

export function isScanRunning(): boolean {
  return state.status === 'running';
}

export function startScan(total: number): void {
  state = {
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    total,
    completed: 0,
    newSignals: 0,
    error: null,
  };
}

// Call once per competitor as it finishes, with how many signals it produced.
export function progressScan(newSignals: number): void {
  state = {
    ...state,
    completed: state.completed + 1,
    newSignals: state.newSignals + newSignals,
  };
}

export function finishScan(error?: string): void {
  state = {
    ...state,
    status: 'idle',
    finishedAt: new Date().toISOString(),
    error: error ?? null,
  };
}
