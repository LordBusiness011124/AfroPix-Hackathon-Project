import { useState, useEffect, useCallback } from 'react';
import * as NearbyConnections from '../lib/NearbyConnections';

type PeerStatus = 'CONNECTED_UNVERIFIED' | 'VERIFIED';

type HostPeer = {
  peerId: string;
  status: PeerStatus;
};

type AppMessage =
  | { type: 'JOIN_REQUEST'; eventCode: string }
  | { type: 'JOIN_ACCEPTED' }
  | { type: 'JOIN_REJECTED'; reason: string }
  | { type: 'ROOM_CLOSED' };

export function useHost(eventCode: string, optEventName?: string | null) {
  const eventName = optEventName ?? 'Activistly Event';
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, HostPeer>>({});
  const [isAdvertising, setIsAdvertising] = useState(false);

  useEffect(() => {
    NearbyConnections.startAdvertise(eventName)
      .then((peerId: string) => {
        setMyPeerId(peerId);
        setIsAdvertising(true);
      })
      .catch((error: unknown) => {
        console.error('Failed to start advertising:', error);
      });

    return () => {
      NearbyConnections.stopAdvertise();
      setIsAdvertising(false);
    };
  }, [eventName]);

  useEffect(() => {
    const onInvitationListener = NearbyConnections.onInvitationReceived(({ peerId }) => {
      NearbyConnections.acceptConnection(peerId);
    });

    const onConnectedListener = NearbyConnections.onConnected(({ peerId }) => {
      setPeers((prev) => ({
        ...prev,
        [peerId]: { peerId, status: 'CONNECTED_UNVERIFIED' },
      }));
    });

    const onTextListener = NearbyConnections.onTextReceived(({ peerId, text }) => {
      let message: AppMessage;
      try {
        message = JSON.parse(text) as AppMessage;
      } catch {
        return;
      }

      if (message.type === 'JOIN_REQUEST') {
        if (message.eventCode === eventCode) {
          NearbyConnections.sendText(
            peerId,
            JSON.stringify({ type: 'JOIN_ACCEPTED' })
          );
          setPeers((prev) => ({
            ...prev,
            [peerId]: { peerId, status: 'VERIFIED' },
          }));
        } else {
          NearbyConnections.sendText(
            peerId,
            JSON.stringify({ type: 'JOIN_REJECTED', reason: 'Invalid event code' })
          );
          NearbyConnections.disconnect(peerId);
        }
      }
    });

    const onDisconnectedListener = NearbyConnections.onDisconnected(({ peerId }) => {
      setPeers((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    return () => {
      onInvitationListener();
      onConnectedListener();
      onTextListener();
      onDisconnectedListener();
    };
  }, [eventCode]);

  const endEvent = useCallback(() => {
    const goodbyeMessage = JSON.stringify({ type: 'ROOM_CLOSED' });

    Object.keys(peers).forEach((peerId) => {
      try {
        NearbyConnections.sendText(peerId, goodbyeMessage);
        NearbyConnections.disconnect(peerId);
      } catch (e) {
        console.warn(`Failed to disconnect peer ${peerId}`, e);
      }
    });

    NearbyConnections.stopAdvertise();
    setIsAdvertising(false);
    setPeers({});
  }, [peers]);

  const verifiedPeers = Object.values(peers)
    .filter((p) => p.status === 'VERIFIED')
    .map((p) => p.peerId);

  return {
    myPeerId,
    isAdvertising,
    verifiedPeers,
    endEvent,
  };
}
