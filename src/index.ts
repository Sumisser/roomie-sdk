/* eslint-disable @typescript-eslint/no-explicit-any */

export class RoomieSDK {
  private queStore: Record<string, any[]> = {};
  private stateChangeCallback?: (data: any) => void;

  constructor() {
    this.init();
  }

  init(): void {
    this.onListenMsg();
  }

  actionSendMsg(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const message = JSON.stringify({ ...data, source: 'roomie-sdk' });
        window.parent.postMessage(message, '*');
        resolve(undefined);
      } catch (e) {
        reject(new Error('请检查发送信息是否符合格式'));
      }
    });
  }

  async asyncSendInfo(data: any): Promise<void> {
    const payload = {
      type: 'sendChatMessage',
      payload: { data },
    };
    await this.actionSendMsg(payload);
  }

  async asyncChangeChat(activeKey: any): Promise<void> {
    console.log('asyncChangeChat activeKey', activeKey);
    const payload = {
      type: 'changeChat',
      payload: { data: activeKey },
    };
    await this.actionSendMsg(payload);
  }

  actionGetInfo(syncType: string): Promise<void> {
    return new Promise((resolve) => {
      const payload = { type: 'getData', sync: syncType };
      this.actionSendMsg(payload);
      resolve(undefined);
    });
  }

  async asyncGetInfo(syncType: string): Promise<any> {
    let isResumed = false;
    let resolveFn: (value: any) => void;

    const promise = new Promise((resolve) => {
      resolveFn = (data: any) => {
        isResumed = true;
        resolve(data);
        return isResumed;
      };
    });

    const queueItem = {
      promise,
      pause: () => {
        isResumed = true;
        return !isResumed;
      },
      resume: resolveFn!,
    };

    if (this.queStore[syncType]?.length) {
      this.queStore[syncType].push(queueItem);
    } else {
      this.queStore[syncType] = [queueItem];
    }

    // 先入队，再发送请求，确保响应不会在入队前到达
    this.actionGetInfo(syncType);

    return promise;
  }

  onStateChange(callback: (data: any) => void): void {
    this.stateChangeCallback = callback;
  }

  handleData(message: any): boolean {
    const { type, sync } = message;
    if (type === 'getData') {
      const queue = this.queStore[sync];
      if (queue && queue.length) {
        const item = queue.shift();
        item?.resume(message);
      }
      // 只要是 getData 类型，都认为是响应消息（或内部协议），不再透传给 onStateChange
      return true;
    }
    return false; // 表示这不是响应消息或未被处理
  }

  onListenMsg(): void {
    window.addEventListener(
      'message',
      (event) => {
        if (event.source === window.parent) {
          if (event.data && typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              // handleData 返回 true 表示这是对 asyncGetInfo 等方法的响应
              const isResponse = this.handleData(data);

              // 只有非响应消息（父页面主动推送的消息）才触发 stateChangeCallback
              if (!isResponse && this.stateChangeCallback) {
                this.stateChangeCallback(data);
              }
            } catch (error) {
              console.error('收到无法解析的数据');
            }
          } else {
            console.warn('收到无关的回调信息');
          }
        }
      },
      false,
    );
  }
}

export { RoomieSDK as QuanSideSDK };

if (typeof window !== 'undefined') {
  (window as any).RoomieSDK = RoomieSDK;
  (window as any).QuanSideSDK = RoomieSDK;
}
