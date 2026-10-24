let unlocked = false;

export type StudioAccessResult = 'granted' | 'pin-not-configured' | 'invalid-pin';

export function studioAccessGranted() { return unlocked; }

export function unlockStudio(configuredPin: string, suppliedPin: string): StudioAccessResult {
  if (!/^\d{4,8}$/.test(configuredPin)) return 'pin-not-configured';
  if (suppliedPin !== configuredPin) return 'invalid-pin';
  unlocked = true;
  return 'granted';
}

export function lockStudio() { unlocked = false; }
