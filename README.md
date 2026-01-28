# Roomie SDK

Roomie SDK is a client-side library for communicating with the parent window via `postMessage`. It simplifies sending messages and handling asynchronous responses.

## Installation

```bash
npm install roomie-sdk
```

## Usage

### ES Module / TypeScript

```typescript
import { RoomieSDK } from 'roomie-sdk';

// Initialize the SDK
const sdk = new RoomieSDK();

// Example: Change chat context
await sdk.asyncChangeChat('newChatId');

// Example: Get data asynchronously
const userInfo = await sdk.asyncGetInfo('userInfo');
console.log(userInfo);
```

## API

### `new RoomieSDK()`
Initializes the SDK and starts listening for messages from the parent window.

### Methods

- **`asyncChangeChat(activeKey: any): Promise<void>`**
  Sends a `changeChat` event with the provided key to switch chat context.

- **`asyncGetInfo(syncType: string): Promise<any>`**
  Sends a `getData` event with the specified `syncType` and waits for a response from the parent window.
  Supported types: `'userInfo'`, `'groupInfo'`, `'robotInfo'`.
