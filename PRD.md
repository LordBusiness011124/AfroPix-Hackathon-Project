# Activistly - Product Requirements Document

## Overview
Activistly is a Bluetooth/WiFi-based peer-to-peer messaging application for protesters and protest organizers. It enables off-grid, decentralized communication at protests, marches, and demonstrations without requiring internet connectivity.

## Problem Statement
During protests, cellular networks are often congested, throttled, or intentionally disrupted. Organizers need a reliable way to communicate with participants, and participants need an emergency mechanism to signal for help. Activistly solves this by using Bluetooth/WiFi Direct (via Google Nearby Connections API) to create a local mesh of connected devices.

## Target Users
1. **Protest Organizers** - Create and host events, broadcast messages to all participants, monitor crowd positions
2. **Protesters (Participants)** - Join events, receive broadcasts, message the organizer, trigger panic alerts

## Core Features

### 1. Event Management
- **Create Event**: Organizer enters an event name; system generates a 6-digit access code
- **Host Event**: Organizer starts Bluetooth advertising to accept incoming connections
- **Join Event**: Participants discover nearby events via Bluetooth scanning, enter access code to authenticate
- **End Event / Leave Event**: Clean disconnect with notification to all peers

### 2. Bluetooth P2P Communication
- Uses `expo-nearby-connections` (Google Nearby Connections API)
- **Advertising**: Host advertises with event name as service ID
- **Discovery**: Joiners scan for nearby advertisers
- **Authentication**: Access code verification after transport connection is established
- **Protocol Messages**: JSON-based app-level messages (JOIN_REQUEST, JOIN_ACCEPTED, JOIN_REJECTED, ROOM_CLOSED)

### 3. Messaging / Chat
- **Organizer Broadcast**: Host sends messages to all verified participants simultaneously
- **Participant to Organizer**: Individual participants can message the host directly
- **Real-time delivery**: Messages sent via Nearby Connections text payloads
- **System message filtering**: Protocol/location messages are excluded from chat display

### 4. Panic Button
- Prominent emergency button available to both organizers and participants
- Opens a modal for optional description of the emergency
- Sends `PANIC`-prefixed messages to all connected peers
- Receiving devices display a full-screen emergency alert
- Panic messages are shown as "Emergency alert sent" in chat history

### 5. Location Sharing & Crowd Map
- **Opt-in GPS sharing**: Users can choose to share exact GPS coordinates (become "anchors")
- **Proximity participation**: Users can appear on the map without GPS by proximity estimation
- **Trilateration**: Non-GPS users' positions estimated from distance to 3+ GPS anchors
- **Circle intersection**: 2-anchor position estimation
- **Single anchor estimation**: Approximate ring placement around 1 anchor
- **Crowd Map Modal**: Full-screen map view showing all participants with color-coded markers
  - Green: You
  - Blue: GPS anchors
  - Orange: Triangulated (3+ anchors)
  - Purple: 2-anchor estimate
  - Gray: 1-anchor estimate
- **Accuracy circles**: Visual radius showing position confidence

### 6. Persistent Storage
- Event code and name saved to AsyncStorage for session persistence

## Technical Stack
- **Framework**: React Native via Expo SDK 54
- **Routing**: Expo Router (file-based, tab navigation)
- **P2P Communication**: expo-nearby-connections
- **Location**: expo-location
- **Maps**: react-native-maps
- **Storage**: @react-native-async-storage/async-storage
- **Haptics**: expo-haptics
- **Animations**: react-native-reanimated
- **Language**: TypeScript (strict mode)
- **Fonts**: IBM Plex Sans, IBM Plex Mono

## UI/UX Design
- Dark theme by default (near-black background #191A1F)
- Muted green-gray accent color (#8FAEA3)
- Danger/panic elements in muted red (#B55A5A)
- IBM Plex font family for utilitarian, protest-appropriate aesthetic
- Minimal, functional design prioritizing quick actions under stress

## Platform Support
- **iOS**: Requires Bluetooth and location permissions
- **Android**: Requires Bluetooth, WiFi, and location permissions (fine + coarse)
- **Permissions**: NSLocationWhenInUseUsageDescription, Bluetooth advertise/connect/scan, Nearby WiFi devices

## Non-Functional Requirements
- Must work without internet connectivity
- Low battery consumption (Balanced location accuracy)
- Messages must not persist beyond the session (ephemeral by design)
- No user accounts or cloud storage (privacy-first)
- All communication is local/P2P only

## App States
1. **Idle**: Home screen with Create Event, Start Event (Host), and Join Event options
2. **Hosting**: Advertising, accepting connections, broadcasting messages, viewing crowd map
3. **Joining/Discovery**: Scanning for nearby events, entering access codes
4. **In Room (Participant)**: Connected to host, receiving broadcasts, sending messages, panic button available
