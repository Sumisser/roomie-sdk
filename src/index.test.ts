import { RoomieSDK } from './index';
import { QuanSideSDK } from './index';

describe('RoomieSDK', () => {
  let sdk: RoomieSDK;
  let postMessageMock: jest.Mock;
  let messageHandlers: ((event: any) => void)[] = [];

  beforeEach(() => {
    messageHandlers = [];
    postMessageMock = jest.fn();

    // Mock window
    global.window = {
      addEventListener: jest.fn((event, handler) => {
        if (event === 'message') {
          messageHandlers.push(handler);
        }
      }),
      parent: {
        postMessage: postMessageMock,
      },
    } as any;

    // Mock MessageEvent
    global.MessageEvent = class MessageEvent {
      data: any;
      source: any;
      type: string;
      constructor(type: string, init: any) {
        this.type = type;
        this.data = init.data;
        this.source = init.source;
      }
    } as any;

    sdk = new RoomieSDK();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and listen to messages', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    new RoomieSDK();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
      false,
    );
  });

  it('QuanSideSDK alias should work', () => {
    expect(new QuanSideSDK()).toBeInstanceOf(RoomieSDK);
  });

  it('asyncSendInfo should post correct message', async () => {
    const data = { hello: 'world' };
    await sdk.asyncSendInfo(data);

    expect(postMessageMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'sendChatMessage',
        payload: { data },
        source: 'roomie-sdk',
      }),
      '*',
    );
  });

  it('asyncChangeChat should post correct message', async () => {
    const activeKey = 'chat123';
    await sdk.asyncChangeChat(activeKey);

    expect(postMessageMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'changeChat',
        payload: { data: activeKey },
        source: 'roomie-sdk',
      }),
      '*',
    );
  });

  it('asyncGetInfo should wait for response', async () => {
    const syncType = 'userInfo';
    const responseData = {
      type: 'getData',
      sync: syncType,
      data: { name: 'User' },
    };

    // Start the async request
    const promise = sdk.asyncGetInfo(syncType);

    // Verify request message was sent
    expect(postMessageMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'getData',
        sync: syncType,
        source: 'roomie-sdk',
      }),
      '*',
    );

    // Simulate incoming message from parent
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(responseData),
      source: window.parent,
    });

    // Manually trigger handlers
    messageHandlers.forEach((handler) => handler(messageEvent));

    // Verify the promise resolves with the response data
    const result = await promise;
    expect(result).toEqual(responseData);
  });

  it('onMessage should be called for non-response messages', () => {
    const callback = jest.fn();
    sdk.onMessage(callback);

    const customMessage = {
      type: 'customEvent',
      data: { foo: 'bar' },
    };

    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(customMessage),
      source: window.parent,
    });

    // Manually trigger handlers
    messageHandlers.forEach((handler) => handler(messageEvent));

    expect(callback).toHaveBeenCalledWith(customMessage);
  });

  it('onMessage should NOT be called for getData messages', () => {
    const callback = jest.fn();
    sdk.onMessage(callback);

    const getDataMessage = {
      type: 'getData',
      sync: 'userInfo',
      data: { name: 'User' },
    };

    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(getDataMessage),
      source: window.parent,
    });

    // Manually trigger handlers
    messageHandlers.forEach((handler) => handler(messageEvent));

    expect(callback).not.toHaveBeenCalled();
  });

  it('subsequent calls to onMessage should overwrite the previous callback', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    sdk.onMessage(cb1);
    sdk.onMessage(cb2); // Should overwrite cb1

    const msg = { type: 'test', data: 123 };
    const event = new MessageEvent('message', {
      data: JSON.stringify(msg),
      source: window.parent,
    });

    messageHandlers.forEach((h) => h(event));

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledWith(msg);
  });
});

