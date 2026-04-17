# Roomie SDK

Roomie SDK is a client-side library for communicating with the parent window via `postMessage`. It simplifies sending messages and handling asynchronous responses.

## Installation

```bash
npm install roomie-sdk
```

## Quick Start

```typescript
import { RoomieSDK } from 'roomie-sdk';

// Initialize the SDK
const sdk = new RoomieSDK();

// Listen to parent window state changes
sdk.onStateChange((data) => {
  console.log('Received from parent:', data);
});

// Send data to parent
await sdk.asyncSendInfo({ message: 'Hello' });

// Get data from parent
const userInfo = await sdk.asyncGetInfo('userInfo');
```

## API Reference

### `new RoomieSDK()`
Initializes the SDK and starts listening for messages from the parent window.

### Methods

#### `onStateChange(callback: (data: any) => void): void`
Listen to messages actively pushed by the parent window.

**Important**: This callback only receives messages **actively pushed** by the parent window. It does NOT receive responses to `asyncGetInfo` or other request methods.

```typescript
sdk.onStateChange((data) => {
  // Handle parent window state changes
  console.log('Parent pushed:', data);
});
```

#### `asyncChangeChat(activeKey: any): Promise<void>`
Sends a `changeChat` event with the provided key to switch chat context.

```typescript
await sdk.asyncChangeChat('newChatId');
```

#### `asyncSendInfo(data: any): Promise<void>`
Sends a chat message to the parent window.

```typescript
await sdk.asyncSendInfo({ 
  message: 'Hello',
  timestamp: Date.now() 
});
```

#### `asyncGetInfo(syncType: string): Promise<any>`
Sends a `getData` event with the specified `syncType` and waits for a response from the parent window.

Supported types: `'sessionInfo'`, `'userInfo'`, `'userInfoByPlainText'`, `'groupInfo'`, `'robotInfo'`, `'customerInfo'`

```typescript
const userInfo = await sdk.asyncGetInfo('userInfo');
console.log(userInfo);
```

## Usage Examples

### Basic Usage

```typescript
import { RoomieSDK } from 'roomie-sdk';

// Create SDK instance
const sdk = new RoomieSDK();

// Register state change callback
sdk.onStateChange((data) => {
  console.log('Received from parent:', data);
  
  // Handle different message types
  switch (data.type) {
    case 'customEvent':
      handleCustomEvent(data);
      break;
    case 'stateUpdate':
      updateLocalState(data.payload);
      break;
    default:
      console.log('Unknown message type:', data);
  }
});
```

### React Example

```tsx
import { useEffect, useState } from 'react';
import { RoomieSDK } from 'roomie-sdk';

function App() {
  const [parentData, setParentData] = useState<any>(null);
  const [sdk] = useState(() => new RoomieSDK());

  useEffect(() => {
    // Listen to parent window messages
    sdk.onStateChange((data) => {
      setParentData(data);
      
      // Update different states based on message type
      if (data.type === 'userUpdate') {
        // Update user info
      }
    });
  }, [sdk]);

  return (
    <div>
      <h1>Child Application</h1>
      <pre>{JSON.stringify(parentData, null, 2)}</pre>
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div>
    <h1>Child Application</h1>
    <pre>{{ parentData }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RoomieSDK } from 'roomie-sdk';

const parentData = ref(null);
const sdk = new RoomieSDK();

onMounted(() => {
  sdk.onStateChange((data) => {
    parentData.value = data;
    handleParentMessage(data);
  });
});

function handleParentMessage(data) {
  console.log('Received message:', data);
  // Your business logic
}
</script>
```

### Parent Window Sending Messages

The parent window can send data with any structure:

```javascript
// Parent window code
const iframe = document.getElementById('your-iframe');

// Send custom structured data
iframe.contentWindow.postMessage(
  JSON.stringify({
    type: 'customEvent',
    payload: {
      userId: '123',
      userName: 'John',
      // ... any other data
    },
    timestamp: Date.now()
  }),
  '*'
);

// Or send simple data
iframe.contentWindow.postMessage(
  JSON.stringify({
    type: 'stateUpdate',
    data: { count: 42 }
  }),
  '*'
);
```

### Complete Example

```typescript
import { RoomieSDK } from 'roomie-sdk';

class MyApp {
  private sdk: RoomieSDK;
  
  constructor() {
    this.sdk = new RoomieSDK();
    this.setupMessageListener();
  }
  
  setupMessageListener() {
    this.sdk.onStateChange((data) => {
      console.log('[MyApp] Received from parent:', data);
      this.handleParentMessage(data);
    });
  }
  
  handleParentMessage(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'init':
        this.initialize(payload);
        break;
      case 'update':
        this.update(payload);
        break;
      default:
        console.log('Unhandled message type:', type);
    }
  }
  
  initialize(config: any) {
    console.log('Initializing app:', config);
  }
  
  update(data: any) {
    console.log('Updating data:', data);
  }
}

// Usage
const app = new MyApp();
```

## Message Types

### Messages that trigger `onStateChange`

✅ **Parent actively pushed messages** - These will trigger the callback:

```typescript
// Custom events
{
  type: 'customEvent',
  payload: { ... }
}

// State updates
{
  type: 'stateUpdate',
  data: { ... }
}
```

❌ **Response messages** - These will NOT trigger the callback:

```typescript
// Responses to asyncGetInfo
{
  type: 'getData',
  sync: 'userInfo',
  payload: { ... }
}
```

## Important Notes

1. **Data Format**: Data sent by the parent window must be JSON-serializable (can be processed by `JSON.stringify` and `JSON.parse`)
2. **Message Source Validation**: The SDK automatically validates that messages come from the parent window (`event.source === window.parent`)
3. **Callback Overwrite**: Calling `onStateChange` multiple times will overwrite the previous callback
4. **Error Handling**: The SDK automatically handles JSON parsing errors; invalid data will log errors to the console
5. **Response Message Filtering**: ⚠️ **Important** - `onStateChange` only receives messages **actively pushed** by the parent window, NOT responses to `asyncGetInfo` or other request methods
6. **Compatibility**: `onStateChange` does not affect existing SDK methods like `asyncGetInfo`; both can be used simultaneously

## License

MIT

