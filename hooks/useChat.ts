import { useState, useEffect } from 'react';
import * as NearbyConnections from '../lib/NearbyConnections';

const LOCATION_MESSAGE_TYPES = ['GPS_ANCHOR', 'RSSI_REPORT'];

function isLocationMessage(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    return LOCATION_MESSAGE_TYPES.includes(parsed.type);
  } catch {
    return false;
  }
}

export function useChat(connectedPeerIds: string[] = []) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const onTextReceivedListener = NearbyConnections.onTextReceived(
      (data: { peerId: string; text: string }) => {
        if (isLocationMessage(data.text)) {
          return;
        }

        if (data.text.trim().startsWith('{"type":')) {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: data.peerId,
            text: data.text,
            timestamp: new Date().toLocaleTimeString(),
            isMe: false,
          },
        ]);
      }
    );

    return () => {
      onTextReceivedListener();
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      for (const id of connectedPeerIds) {
        await NearbyConnections.sendText(id, text);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: 'me',
          text: text,
          timestamp: new Date().toLocaleTimeString(),
          isMe: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return {
    messages,
    sendMessage,
    clearChat: () => setMessages([]),
  };
}
