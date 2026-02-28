import { useState, useEffect, useCallback } from 'react';
import * as NearbyConnections from '../lib/NearbyConnections';

type JoinState = 'IDLE' | 'CONNECTING' | 'AWAITING_AUTH' | 'IN_ROOM';

type AppMessage =
  | { type: 'JOIN_REQUEST'; eventCode: string }
  | { type: 'JOIN_ACCEPTED' }
  | { type: 'JOIN_REJECTED'; reason: string }
  | { type: 'ROOM_CLOSED' };

export function useJoin(userName = 'Protestor') {
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [discoveredPeers, setDiscoveredPeers] = useState<any[]>([]);
  const [joinState, setJoinState] = useState<JoinState>('IDLE');
  const [connectedHostId, setConnectedHostId] = useState<string | null>(null);
  const [pendingEventCode, setPendingEventCode] = useState<string | null>(null);

  useEffect(() => {
    NearbyConnections.startDiscovery(userName)
      .then((peerId: string) => {
        setMyPeerId(peerId);
      })
      .catch((error: unknown) => {
        console.error('Discovery error:', error);
      });

    return () => {
      NearbyConnections.stopDiscovery();
    };
  }, [userName]);

  useEffect(() => {
    const onPeerFoundListener = NearbyConnections.onPeerFound((data) => {
      setDiscoveredPeers((prev) => {
        if (prev.find((p) => p.peerId === data.peerId)) return prev;
        return [...prev, data];
      });
    });

    const onPeerLostListener = NearbyConnections.onPeerLost((data) => {
      setDiscoveredPeers((prev) =>
        prev.filter((peer) => peer.peerId !== data.peerId)
      );
    });

    return () => {
      onPeerFoundListener();
      onPeerLostListener();
    };
  }, []);

  useEffect(() => {
    const onConnectedListener = NearbyConnections.onConnected(({ peerId }) => {
      setConnectedHostId(peerId);
      setJoinState('AWAITING_AUTH');

      if (pendingEventCode) {
        NearbyConnections.sendText(
          peerId,
          JSON.stringify({
            type: 'JOIN_REQUEST',
            eventCode: pendingEventCode,
          } satisfies AppMessage)
        );
      }
    });

    const onTextListener = NearbyConnections.onTextReceived(({ peerId, text }) => {
      let message: AppMessage;
      try {
        message = JSON.parse(text) as AppMessage;
      } catch {
        return;
      }

      if (message.type === 'JOIN_ACCEPTED') {
        setJoinState('IN_ROOM');
      }

      if (message.type === 'JOIN_REJECTED') {
        NearbyConnections.disconnect(peerId);
        setJoinState('IDLE');
        setConnectedHostId(null);
        alert(message.reason);
      }

      if (message.type === 'ROOM_CLOSED') {
        alert('The organizer has ended the event.');
        NearbyConnections.disconnect(peerId);
        setJoinState('IDLE');
        setConnectedHostId(null);
      }
    });

    const onDisconnectedListener = NearbyConnections.onDisconnected(() => {
      setJoinState('IDLE');
      setConnectedHostId(null);
    });

    return () => {
      onConnectedListener();
      onTextListener();
      onDisconnectedListener();
    };
  }, [pendingEventCode]);

  const joinHost = (hostPeerId: string, eventCode: string) => {
    setPendingEventCode(eventCode);
    setJoinState('CONNECTING');
    NearbyConnections.requestConnection(hostPeerId);
  };

  const leaveRoom = useCallback(() => {
    if (connectedHostId) {
      NearbyConnections.disconnect(connectedHostId);
    }
    setJoinState('IDLE');
    setConnectedHostId(null);
    setPendingEventCode(null);
  }, [connectedHostId]);

  return {
    myPeerId,
    discoveredPeers,
    joinState,
    connectedHostId,
    joinHost,
    leaveRoom,
  };
}
