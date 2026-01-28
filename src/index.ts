/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RoomieSDKOptions {
  env?: 'testing' | 'production';
  ucid?: string;
}

export class RoomieSDK {
  private queStore: Record<string, any[]> = {};
  private options?: RoomieSDKOptions;

  constructor(options?: RoomieSDKOptions) {
    this.options = options;
    this.init(options);
  }

  init(options?: RoomieSDKOptions): void {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.onListenMsg();
    this.injectScript();
  }

  injectScript(): void {
    if (typeof document === 'undefined') return;
    const url = '//file.ljcdn.com/fee/index.js';
    if (document.querySelector(`script[src="${url}"]`)) return;
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      const dt = (window as any).dt;
      if (dt) {
        const getEnv = () => {
          if (this.options?.env) return this.options.env;
          if (
            window.location.hostname.includes('test') ||
            window.location.hostname.includes('preview')
          ) {
            return 'testing';
          } else {
            return 'production';
          }
        };
        const ucid = this.options?.ucid || window.localStorage.getItem('ucid');
        dt.set({
          pid: 'roomie',
          env: getEnv(),
          ucid: ucid,
          record: {
            spa: true,
            time_on_page: true,
            performance: true,
            js_error: true,
            js_error_report_config: {
              ERROR_RUNTIME: true,
              ERROR_SCRIPT: true,
              ERROR_STYLE: true,
              ERROR_IMAGE: false,
              ERROR_AUDIO: false,
              ERROR_VIDEO: false,
              ERROR_CONSOLE: false,
              ERROR_TRY_CATCH: true,
            },
          },
        });
      }
    };
    const target = document.head || document.body;
    if (target) {
      target.appendChild(script);
    }
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
    this.actionGetInfo(syncType);
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

    return promise;
  }

  handleData(message: any): void {
    const { type, sync } = message;
    if (type === 'getData') {
      switch (sync) {
        case 'userInfo':
        case 'userInfoByPlainText':
        case 'groupInfo':
        case 'robotInfo':
        case 'customerInfo': {
          const queue = this.queStore[sync];
          if (queue && queue.length) {
            const item = queue.shift();
            item?.resume(message);
          }
          break;
        }
        default:
          console.warn('无法处理该回调信息');
      }
    }
  }

  onListenMsg(): void {
    window.addEventListener(
      'message',
      (event) => {
        if (event.source === window.parent) {
          if (event.data && typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              this.handleData(data);
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
