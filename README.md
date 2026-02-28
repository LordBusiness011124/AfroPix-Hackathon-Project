# Activistly

Bluetooth/WiFi peer-to-peer messaging for protest organizers and participants. Works completely offline — no internet connection, no shared WiFi network, and no cellular service required. Everything runs over airplane mode.

## Features

- **Event Creation & Management** - Organizers create events with 6-digit access codes
- **Bluetooth P2P Messaging** - Off-grid communication via Google Nearby Connections, no WiFi needed
- **Broadcast Messages** - Organizers blast messages to all connected participants
- **Panic Button** - Emergency alert system that notifies everyone instantly
- **Crowd Map** - Live map showing participant locations with GPS + proximity estimation
- **Privacy-First** - No accounts, no cloud, all communication is local and ephemeral

---

## Demo Setup: Installing on Two iPhones

### Prerequisites

- Two iPhones running iOS 16 or later
- A Mac or PC with Node.js 18+ installed
- Bluetooth enabled on both phones (no WiFi, no internet, no shared network required)

### Step 1: Install Expo Go on Both iPhones

1. Open the **App Store** on each iPhone
2. Search for **"Expo Go"**
3. Install the app (it is free)

### Step 2: Install Dependencies on Your Computer

Open a terminal and run:

```bash
cd /path/to/Activistly
npm install
```

### Step 3: Start the Development Server

```bash
npx expo start
```

This will display a QR code in your terminal.

### Step 4: Connect Both iPhones

1. On **iPhone 1** (the Organizer):
   - Open the Camera app
   - Point it at the QR code displayed in your terminal
   - Tap the Expo Go banner that appears to open the app

2. On **iPhone 2** (the Protestor):
   - Do the same thing -- scan the QR code with the Camera app
   - Tap to open in Expo Go

> **Note:** If the QR code does not connect, press `s` in the terminal to switch to tunnel mode, then re-scan.

### Step 5: Grant Permissions

When the app opens on each phone, it will ask for permissions. **Accept all of them**:
- **Bluetooth** - Required for P2P communication
- **Location** - Required for the crowd map feature
- **Local Network** (iOS) - Required for Bluetooth device discovery (no actual network connection needed)

---

## Demo Walkthrough

### On iPhone 1 (Organizer):

1. Type an event name (e.g., "March for Justice")
2. Tap **"Create an Event"**
3. Note the 6-digit access code shown in the popup (e.g., `482931`)
4. Tap **OK** to dismiss
5. Tap **"Start Event (Organizer)"**
6. The phone is now advertising via Bluetooth and waiting for participants

### On iPhone 2 (Protestor):

1. Tap **"Join an Event"**
2. Wait a few seconds -- the organizer's event should appear under "Available Events"
3. Type the 6-digit access code in the text field
4. Tap **"Join"** next to the event name
5. You are now connected to the organizer

### Demo the Features:

**Messaging:**
- On the organizer phone, type a message and tap **"Send Blast"** -- it appears on the protestor's screen
- On the protestor phone, type a message and tap **"Send"** -- it appears on the organizer's screen

**Panic Button:**
- On either phone, tap **"PANIC ALERT"**
- Optionally type an emergency description
- Tap **"Send Alert"** -- the other phone shows an emergency popup

**Crowd Map:**
- On either phone, toggle **"Show me on map"** to ON
- Optionally toggle **"Share my GPS"** to ON
- Tap **"View Crowd Map"** to see participants on a live map

---

## Important Notes for Expo Go

### Bluetooth Limitations in Expo Go

`expo-nearby-connections` requires a **development build** (not just Expo Go) to use native Bluetooth APIs. If Bluetooth features do not work in Expo Go, you need to create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
npx eas login

# Create a development build for iOS
npx eas build --profile development --platform ios
```

This generates an installable `.ipa` file. Install it on both iPhones via:
1. Download the build from the link EAS provides
2. Or use `npx eas build:run -p ios` if you have a simulator

### Creating a Development Build for Physical Devices

For testing on real iPhones with full Bluetooth support:

```bash
# Register your devices first
npx eas device:create

# Build for internal distribution
npx eas build --profile development --platform ios --local
```

Then install the build on each iPhone using the QR code or link provided by EAS.

Once the development build is installed, start the dev server with:

```bash
npx expo start --dev-client
```

Scan the QR code from within the installed development build (not Expo Go).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| QR code does not connect | Press `s` in terminal for tunnel mode and re-scan |
| Bluetooth not working | You need a development build, not Expo Go (see above) |
| Event not appearing in discovery | Make sure both phones have Bluetooth ON and are within ~30 feet |
| Location not showing on map | Tap "Show me on map" and grant location permission when prompted |
| App crashes on launch | Run `npm install` again, then `npx expo start --clear` |

## Tech Stack

- React Native + Expo SDK 54
- expo-nearby-connections (Google Nearby Connections API)
- expo-location + react-native-maps
- TypeScript
