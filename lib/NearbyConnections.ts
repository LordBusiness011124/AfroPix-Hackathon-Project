type Unsubscribe = () => void;

export interface TextReceived {
  peerId: string;
  text: string;
}

interface PeerData {
  peerId: string;
  name?: string;
}

interface ConnectionData {
  peerId: string;
}

let nativeModule: any = null;
let isNativeAvailable = false;

try {
  nativeModule = require('expo-nearby-connections');
  isNativeAvailable = true;
} catch {
  console.warn(
    '[Activistly] expo-nearby-connections native module not available. ' +
      'Bluetooth features require a development build.'
  );
}

const noopUnsubscribe: Unsubscribe = () => {};

export async function startAdvertise(name: string): Promise<string> {
  if (isNativeAvailable) {
    return nativeModule.startAdvertise(name);
  }
  console.log('[Mock] startAdvertise:', name);
  return 'mock-host-peer-id';
}

export function stopAdvertise(): void {
  if (isNativeAvailable) {
    nativeModule.stopAdvertise();
    return;
  }
  console.log('[Mock] stopAdvertise');
}

export async function startDiscovery(name: string): Promise<string> {
  if (isNativeAvailable) {
    return nativeModule.startDiscovery(name);
  }
  console.log('[Mock] startDiscovery:', name);
  return 'mock-guest-peer-id';
}

export function stopDiscovery(): void {
  if (isNativeAvailable) {
    nativeModule.stopDiscovery();
    return;
  }
  console.log('[Mock] stopDiscovery');
}

export async function sendText(peerId: string, text: string): Promise<void> {
  if (isNativeAvailable) {
    return nativeModule.sendText(peerId, text);
  }
  console.log('[Mock] sendText to', peerId, ':', text.substring(0, 50));
}

export function acceptConnection(peerId: string): void {
  if (isNativeAvailable) {
    nativeModule.acceptConnection(peerId);
    return;
  }
  console.log('[Mock] acceptConnection:', peerId);
}

export function requestConnection(peerId: string): void {
  if (isNativeAvailable) {
    nativeModule.requestConnection(peerId);
    return;
  }
  console.log('[Mock] requestConnection:', peerId);
}

export function disconnect(peerId: string): void {
  if (isNativeAvailable) {
    nativeModule.disconnect(peerId);
    return;
  }
  console.log('[Mock] disconnect:', peerId);
}

export function onInvitationReceived(
  callback: (data: ConnectionData) => void
): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onInvitationReceived(callback);
  }
  return noopUnsubscribe;
}

export function onConnected(callback: (data: ConnectionData) => void): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onConnected(callback);
  }
  return noopUnsubscribe;
}

export function onDisconnected(callback: (data: ConnectionData) => void): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onDisconnected(callback);
  }
  return noopUnsubscribe;
}

export function onTextReceived(callback: (data: TextReceived) => void): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onTextReceived(callback);
  }
  return noopUnsubscribe;
}

export function onPeerFound(callback: (data: PeerData) => void): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onPeerFound(callback);
  }
  return noopUnsubscribe;
}

export function onPeerLost(callback: (data: PeerData) => void): Unsubscribe {
  if (isNativeAvailable) {
    return nativeModule.onPeerLost(callback);
  }
  return noopUnsubscribe;
}

export function isAvailable(): boolean {
  return isNativeAvailable;
}
