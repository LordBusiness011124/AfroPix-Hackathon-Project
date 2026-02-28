export interface Peer {
  peerId: string;
  peerName: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface NearbyData {
  peerId: string;
  peerName?: string;
  text?: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface GPSAnchorMessage {
  type: 'GPS_ANCHOR';
  peerId: string;
  peerName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface ProximityReading {
  targetPeerId: string;
  estimatedDistance: number;
}

export interface ProximityReportMessage {
  type: 'PROXIMITY_REPORT';
  peerId: string;
  peerName: string;
  readings: ProximityReading[];
  timestamp: string;
}

export interface RSSIReading {
  targetPeerId: string;
  rssi: number;
  timestamp: string;
}

export interface RSSIReportMessage {
  type: 'RSSI_REPORT';
  peerId: string;
  peerName: string;
  readings: RSSIReading[];
}

export interface UserPosition {
  peerId: string;
  peerName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'triangulated' | 'estimated-1' | 'estimated-2';
  isAnchor: boolean;
  lastUpdate: string;
  anchorDistance?: number;
  anchorLat?: number;
  anchorLng?: number;
  anchor2Lat?: number;
  anchor2Lng?: number;
  anchor2Distance?: number;
}

export type LocationMessage = GPSAnchorMessage | ProximityReportMessage;

export interface HostRoomProps {
  eventCode: string | null;
  eventName: string | null;
  onExit: () => void;
}

export interface JoinRoomProps {
  onExit: () => void;
}
