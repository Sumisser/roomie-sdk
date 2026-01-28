# Roomie 接入文档

本文档旨在指导开发者将应用接入到 Roomie 侧边栏中，包含 SDK 通讯协议、开发规范及注意事项。

## 1. SDK 接入与通讯

本 SDK 用于 iframe 内嵌页面与父级窗口进行通讯，提供获取用户信息、调起会话等能力。

### NPM 安装

```bash
npm install roomie-sdk
```

使用 ES Module 引入：

```typescript
import { RoomieSDK } from 'roomie-sdk';

// 初始化 SDK
const sdk = new RoomieSDK();
```

### API 说明

#### 1. 获取数据: `asyncGetInfo`

用于请求父级窗口的数据。

**方法签名**: `asyncGetInfo(type: string): Promise<any>`

**参数说明 (`type`)**:

| 值 | 描述 |
| :--- | :--- |
| `userInfo` | 客户资料 |
| `groupInfo` | 群资料 |
| `robotInfo` | 机器人资料 |

**使用示例**:

```javascript
sdk.asyncGetInfo('userInfo').then(res => {
  console.log("获取到的用户信息:", res);
});
```

---

#### 2. 调起会话: `asyncChangeChat`

用于切换或打开指定的会话，传入 `robotId`, `groupId`, `unionId` 区分群聊和私聊。

**方法签名**: `asyncChangeChat(data: any): Promise<void>`

**参数说明 (`data`)**:

| 字段 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `robotId` | string | 是 | 机器人 ID |
| `unionId` | string | 否 | 用户 UnionId (私聊时使用) |
| `groupId` | string | 否 | 群聊 ID (群聊时使用) |

**使用示例**:

```javascript
// 私聊
const privateChatParams = {
    robotId: '12345',
    unionId: 'union_001'
}

// 群聊
const groupChatParams = {
    robotId: '12345',
    groupId: 'group_001'
}

sdk.asyncChangeChat(privateChatParams).then(() => {
  console.log("调起会话成功");
});
```

### 返回数据结构说明

#### 1. `userInfo` (客户资料)

| 字段 | 描述 |
| :--- | :--- |
| `unionId` | 微信 UnionId |
| `avatar` | 头像 URL |
| `name` | 昵称 |

#### 2. `groupInfo` (群资料)

| 字段 | 描述 |
| :--- | :--- |
| `id` | 群 ID |
| `name` | 群名称 |

#### 3. `robotInfo` (机器人资料)

| 字段 | 描述 |
| :--- | :--- |
| `robotId` | 机器人 ID |
| `avatar` | 头像 |
| `name` | 名称 |

## 2. 开发规范

### 2.1 域名与登录
为了确保能够共享单点登录（SSO）的登录状态，接入 Roomie 的项目 **一级域名必须是 `ke.com`**。

### 2.2 环境配置与本地调试
侧边栏配置支持配置 **线上环境**、**测试环境** 以及便于开发的 **`devUrl`**。

**本地开发调试步骤**：
1. **配置 `devUrl`**：在侧边栏配置中填入你的本地开发地址。
2. **Host 绑定**：由于域名限制，本地启动的服务也需要通过 Host 绑定映射到 `ke.com` 域名下（例如 `127.0.0.1 my-project.ke.com`）。
3. **启用开发环境**：在 Roomie 测试环境的 URL 中添加参数 `domain=dev`，此时侧边栏将优先加载配置的 `devUrl`。
4. **浏览器建议**：如果遇到跨域或 Cookie 限制导致无法调试，建议尝试使用 **火狐浏览器 (Firefox)**。

## 3. UI/UX 设计规范

由于侧边栏宽度支持用户进行较大范围的调节，页面设计需要具有良好的自适应性。

- **响应式布局**：推荐使用 CSS **`@container` (容器查询)** 进行响应式开发，以便根据侧边栏实际宽度调整布局。
- **视觉样式**：
    - **背景**：容器背景推荐采用 **白色**。
    - **间距**：请自行增加适当的 **内边距 (Padding)**，避免内容紧贴边缘。
    - **字体**：正文字体大小推荐使用 **14px**。

## 4. 注意事项

### 4.1 状态管理
- **重载机制**：请注意，当用户 **切换会话**（例如从 A 群切到 B 群）时，侧边栏页面会 **重新加载**。
- **建议**：页面不宜存在层级太深或未持久化的复杂状态依赖。建议将页面设计为轻量级，或做好状态的 URL 同步/本地存储，以便重载后能快速恢复上下文。
