import { useState, useEffect, useCallback } from 'react';
import * as NearbyConnections from '../lib/NearbyConnections';
import {
  GPSLocation,
  GPSAnchorMessage,
  ProximityReportMessage,
  ProximityReading,
  UserPosition,
} from '../constants/types';
import { useLocation } from './useLocation';

const DEFAULT_PROXIMITY_DISTANCE = 25;

function circleIntersection(
  c1: { lat: number; lng: number; distance: number },
  c2: { lat: number; lng: number; distance: number },
  peerId: string
): { latitude: number; longitude: number } | null {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((c1.lat * Math.PI) / 180);

  const x1 = 0;
  const y1 = 0;
  const x2 = (c2.lng - c1.lng) * metersPerDegreeLng;
  const y2 = (c2.lat - c1.lat) * metersPerDegreeLat;
  const r1 = c1.distance;
  const r2 = c2.distance;

  const d = Math.sqrt(x2 * x2 + y2 * y2);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    const ratio = r1 / (r1 + r2);
    return {
      latitude: c1.lat + (c2.lat - c1.lat) * ratio,
      longitude: c1.lng + (c2.lng - c1.lng) * ratio,
    };
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const px = x1 + (a * (x2 - x1)) / d;
  const py = y1 + (a * (y2 - y1)) / d;

  const sign = peerId.charCodeAt(0) % 2 === 0 ? 1 : -1;

  const ix = px + (sign * h * (y2 - y1)) / d;
  const iy = py - (sign * h * (x2 - x1)) / d;

  return {
    latitude: c1.lat + iy / metersPerDegreeLat,
    longitude: c1.lng + ix / metersPerDegreeLng,
  };
}

function trilaterate(
  anchors: Array<{ lat: number; lng: number; distance: number }>
): { latitude: number; longitude: number; accuracy: number } | null {
  if (anchors.length < 3) return null;

  const refLat = anchors[0].lat;
  const refLng = anchors[0].lng;

  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((refLat * Math.PI) / 180);

  const points = anchors.slice(0, 3).map((a) => ({
    x: (a.lng - refLng) * metersPerDegreeLng,
    y: (a.lat - refLat) * metersPerDegreeLat,
    r: a.distance,
  }));

  const [p1, p2, p3] = points;

  const A = 2 * p2.x - 2 * p1.x;
  const B = 2 * p2.y - 2 * p1.y;
  const C = p1.r ** 2 - p2.r ** 2 - p1.x ** 2 + p2.x ** 2 - p1.y ** 2 + p2.y ** 2;
  const D = 2 * p3.x - 2 * p2.x;
  const E = 2 * p3.y - 2 * p2.y;
  const F = p2.r ** 2 - p3.r ** 2 - p2.x ** 2 + p3.x ** 2 - p2.y ** 2 + p3.y ** 2;

  const denominator = A * E - B * D;
  if (Math.abs(denominator) < 0.0001) return null;

  const x = (C * E - F * B) / denominator;
  const y = (A * F - C * D) / denominator;

  const latitude = refLat + y / metersPerDegreeLat;
  const longitude = refLng + x / metersPerDegreeLng;

  const avgDistance = anchors.reduce((sum, a) => sum + a.distance, 0) / anchors.length;
  const accuracy = avgDistance * 0.3;

  return { latitude, longitude, accuracy };
}

export interface UseLocationSharingResult {
  isParticipating: boolean;
  isSharingGPS: boolean;
  myLocation: GPSLocation | null;
  userPositions: Map<string, UserPosition>;
  startParticipating: () => void;
  stopParticipating: () => void;
  startSharingGPS: () => Promise<void>;
  stopSharingGPS: () => void;
  getMyAnchorMessage: () => GPSAnchorMessage | null;
}

export function useLocationSharing(
  myPeerId: string,
  myName: string,
  connectedPeerIds: string[]
): UseLocationSharingResult {
  const { location, startTracking, stopTracking, getCurrentLocation } = useLocation();

  const [isParticipating, setIsParticipating] = useState(false);
  const [isSharingGPS, setIsSharingGPS] = useState(false);
  const [userPositions, setUserPositions] = useState<Map<string, UserPosition>>(new Map());
  const [anchors, setAnchors] = useState<Map<string, GPSAnchorMessage>>(new Map());
  const [proximityReports, setProximityReports] = useState<Map<string, ProximityReportMessage>>(new Map());

  useEffect(() => {
    const listener = NearbyConnections.onTextReceived((data: { peerId: string; text: string }) => {
      try {
        const parsed = JSON.parse(data.text);
        if (parsed.type === 'GPS_ANCHOR') {
          const msg = parsed as GPSAnchorMessage;
          setAnchors((prev) => new Map(prev).set(msg.peerId, msg));
        } else if (parsed.type === 'PROXIMITY_REPORT') {
          const msg = parsed as ProximityReportMessage;
          setProximityReports((prev) => new Map(prev).set(msg.peerId, msg));
        }
      } catch {
        // Not a location message
      }
    });

    return () => listener();
  }, []);

  useEffect(() => {
    const newPositions = new Map<string, UserPosition>();

    anchors.forEach((anchor) => {
      newPositions.set(anchor.peerId, {
        peerId: anchor.peerId,
        peerName: anchor.peerName,
        latitude: anchor.latitude,
        longitude: anchor.longitude,
        accuracy: anchor.accuracy,
        source: 'gps',
        isAnchor: true,
        lastUpdate: anchor.timestamp,
      });
    });

    if (isSharingGPS && location) {
      newPositions.set(myPeerId, {
        peerId: myPeerId,
        peerName: myName,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        source: 'gps',
        isAnchor: true,
        lastUpdate: location.timestamp,
      });
    }

    proximityReports.forEach((report, reporterId) => {
      if (anchors.has(reporterId)) return;
      if (reporterId === myPeerId && isSharingGPS) return;

      const visibleAnchors: Array<{ lat: number; lng: number; distance: number }> = [];

      report.readings.forEach((reading) => {
        const anchor = anchors.get(reading.targetPeerId);
        if (anchor) {
          visibleAnchors.push({
            lat: anchor.latitude,
            lng: anchor.longitude,
            distance: reading.estimatedDistance,
          });
        }
      });

      if (visibleAnchors.length >= 3) {
        const estimated = trilaterate(visibleAnchors);
        if (estimated) {
          newPositions.set(reporterId, {
            peerId: report.peerId,
            peerName: report.peerName,
            latitude: estimated.latitude,
            longitude: estimated.longitude,
            accuracy: estimated.accuracy,
            source: 'triangulated',
            isAnchor: false,
            lastUpdate: new Date().toISOString(),
          });
        }
      } else if (visibleAnchors.length === 2) {
        const [a1, a2] = visibleAnchors;
        const intersection = circleIntersection(a1, a2, report.peerId);
        if (intersection) {
          newPositions.set(reporterId, {
            peerId: report.peerId,
            peerName: report.peerName,
            latitude: intersection.latitude,
            longitude: intersection.longitude,
            accuracy: Math.max(a1.distance, a2.distance) * 0.4,
            source: 'estimated-2',
            isAnchor: false,
            lastUpdate: new Date().toISOString(),
            anchorLat: a1.lat,
            anchorLng: a1.lng,
            anchorDistance: a1.distance,
            anchor2Lat: a2.lat,
            anchor2Lng: a2.lng,
            anchor2Distance: a2.distance,
          });
        }
      } else if (visibleAnchors.length === 1) {
        const anchor = visibleAnchors[0];
        const angle = (report.peerId.charCodeAt(0) / 255) * 2 * Math.PI;
        const distance = anchor.distance;
        const offsetLat = (distance / 111320) * Math.cos(angle);
        const offsetLng =
          (distance / (111320 * Math.cos((anchor.lat * Math.PI) / 180))) * Math.sin(angle);

        newPositions.set(reporterId, {
          peerId: report.peerId,
          peerName: report.peerName,
          latitude: anchor.lat + offsetLat,
          longitude: anchor.lng + offsetLng,
          accuracy: distance * 0.5,
          source: 'estimated-1',
          isAnchor: false,
          lastUpdate: new Date().toISOString(),
          anchorLat: anchor.lat,
          anchorLng: anchor.lng,
          anchorDistance: distance,
        });
      }
    });

    setUserPositions(newPositions);
  }, [anchors, proximityReports, isSharingGPS, location, myPeerId, myName]);

  useEffect(() => {
    if (!isSharingGPS || !location) return;

    const broadcastLocation = async () => {
      const message: GPSAnchorMessage = {
        type: 'GPS_ANCHOR',
        peerId: myPeerId,
        peerName: myName,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      };

      for (const peerId of connectedPeerIds) {
        try {
          await NearbyConnections.sendText(peerId, JSON.stringify(message));
        } catch (err) {
          console.error('Failed to broadcast location:', err);
        }
      }
    };

    broadcastLocation();
    const interval = setInterval(broadcastLocation, 5000);
    return () => clearInterval(interval);
  }, [isSharingGPS, location, myPeerId, myName, connectedPeerIds]);

  useEffect(() => {
    if (!isParticipating || isSharingGPS || connectedPeerIds.length === 0) return;

    const reportProximity = async () => {
      const readings: ProximityReading[] = [];

      anchors.forEach((anchor, anchorPeerId) => {
        if (connectedPeerIds.includes(anchorPeerId)) {
          readings.push({
            targetPeerId: anchorPeerId,
            estimatedDistance: DEFAULT_PROXIMITY_DISTANCE,
          });
        }
      });

      const message: ProximityReportMessage = {
        type: 'PROXIMITY_REPORT',
        peerId: myPeerId,
        peerName: myName,
        readings: readings,
        timestamp: new Date().toISOString(),
      };

      for (const peerId of connectedPeerIds) {
        try {
          await NearbyConnections.sendText(peerId, JSON.stringify(message));
        } catch (err) {
          console.error('Failed to send proximity report:', err);
        }
      }
    };

    reportProximity();
    const interval = setInterval(reportProximity, 3000);
    return () => clearInterval(interval);
  }, [isParticipating, isSharingGPS, connectedPeerIds, myPeerId, myName, anchors]);

  const startParticipating = useCallback(() => {
    setIsParticipating(true);
  }, []);

  const stopParticipating = useCallback(() => {
    setIsParticipating(false);
    if (isSharingGPS) {
      stopTracking();
      setIsSharingGPS(false);
    }
  }, [isSharingGPS, stopTracking]);

  const startSharingGPS = useCallback(async () => {
    setIsParticipating(true);
    await getCurrentLocation();
    await startTracking(5000);
    setIsSharingGPS(true);
  }, [getCurrentLocation, startTracking]);

  const stopSharingGPS = useCallback(() => {
    stopTracking();
    setIsSharingGPS(false);
  }, [stopTracking]);

  const getMyAnchorMessage = useCallback((): GPSAnchorMessage | null => {
    if (!isSharingGPS || !location) return null;
    return {
      type: 'GPS_ANCHOR',
      peerId: myPeerId,
      peerName: myName,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    };
  }, [isSharingGPS, location, myPeerId, myName]);

  return {
    isParticipating,
    isSharingGPS,
    myLocation: location,
    userPositions,
    startParticipating,
    stopParticipating,
    startSharingGPS,
    stopSharingGPS,
    getMyAnchorMessage,
  };
}
