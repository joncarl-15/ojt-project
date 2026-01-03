# Real-Time Messaging System

## Overview

The OJT Monitoring System includes a comprehensive real-time messaging feature that enables instant communication between users using Socket.IO. This system provides live messaging, read receipts, message tracking, and activity notifications.

## Table of Contents

1. [Features](#features)
2. [Socket.IO Setup](#socketio-setup)
3. [Message API Endpoints](#message-api-endpoints)
4. [Real-Time Events](#real-time-events)
5. [Client Integration](#client-integration)
6. [Data Models](#data-models)
7. [Authentication](#authentication)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

## Features

### Core Messaging Features

- ✅ **Real-time message delivery** - Instant message transmission
- ✅ **Read receipts** - Know when messages are read
- ✅ **Message seen indicators** - Track when messages are viewed
- ✅ **Activity tracking** - Monitor user messaging activities
- ✅ **Room-based messaging** - Private messaging channels
- ✅ **Message search** - Find specific messages
- ✅ **Message management** - Full CRUD operations

### Real-Time Capabilities

- ✅ **Live message updates** - Messages appear instantly
- ✅ **Typing indicators** - See when someone is typing
- ✅ **Online status** - Know when users are active
- ✅ **Message delivery confirmation** - Confirm message sent
- ✅ **Read status synchronization** - Real-time read status updates

## Socket.IO Setup

### Server Configuration

The Socket.IO server is configured in `index.ts`:

```typescript
import { Server as SocketIOServer } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// Socket connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user to their own room for private messaging
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
```

### Connection URL

```
ws://localhost:3000
```

For production:

```
wss://your-domain.com
```

## Message API Endpoints

### Base Route: `/message`

All message endpoints require authentication.

#### Create Message

**POST** `/message` 🔒

Send a new message to another user.

**Request Body:**

```json
{
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "isRead": false
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": "507f1f77bcf86cd799439011",
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "isRead": false,
  "sentAt": "2025-10-08T10:30:00.000Z",
  "createdAt": "2025-10-08T10:30:00.000Z",
  "updatedAt": "2025-10-08T10:30:00.000Z"
}
```

**Real-time Events Emitted:**

- `newMessage` → sent to receiver
- `messageSent` → sent to sender (confirmation)

---

#### Get Message by ID

**GET** `/message/:id` 🔒

Retrieve a specific message by ID.

**Parameters:**

- `id` (string): Message ID

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe"
  },
  "receiver": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "content": "Hello! How are you doing with your OJT?",
  "isRead": false,
  "sentAt": "2025-10-08T10:30:00.000Z"
}
```

**Real-time Events Emitted:**

- `messageViewed` → sent to viewing user
- `messageSeen` → sent to sender (if receiver views the message)

---

#### Get All Messages

**GET** `/message` 🔒

Retrieve all messages for the authenticated user.

**Response:** `200 OK`

```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "sender": "507f1f77bcf86cd799439011",
    "receiver": "507f1f77bcf86cd799439012",
    "content": "Hello! How are you doing with your OJT?",
    "isRead": false,
    "sentAt": "2025-10-08T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "sender": "507f1f77bcf86cd799439012",
    "receiver": "507f1f77bcf86cd799439011",
    "content": "I'm doing great! Thanks for asking.",
    "isRead": true,
    "sentAt": "2025-10-08T10:32:00.000Z"
  }
]
```

**Real-time Events Emitted:**

- `messagesFetched` → sent to requesting user

---

#### Update Message

**PATCH** `/message` 🔒

Update an existing message.

**Request Body:**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "content": "Hello! How are you doing with your OJT training?",
  "isRead": true
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": "507f1f77bcf86cd799439011",
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT training?",
  "isRead": true,
  "sentAt": "2025-10-08T10:30:00.000Z",
  "updatedAt": "2025-10-08T10:35:00.000Z"
}
```

**Real-time Events Emitted:**

- `messageRead` → sent to sender (if message marked as read)

---

#### Mark Message as Read

**PATCH** `/message/:id/read` 🔒

Mark a specific message as read.

**Parameters:**

- `id` (string): Message ID

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": "507f1f77bcf86cd799439011",
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "isRead": true,
  "sentAt": "2025-10-08T10:30:00.000Z",
  "updatedAt": "2025-10-08T10:35:00.000Z"
}
```

**Real-time Events Emitted:**

- `messageRead` → sent to sender

---

#### Delete Message

**DELETE** `/message/:id` 🔒

Delete a message.

**Parameters:**

- `id` (string): Message ID

**Response:** `200 OK`

```
"Message deleted successfully"
```

---

#### Search Messages

**POST** `/message/search` 🔒

Search for messages using flexible criteria.

**Request Body:**

```json
{
  "content": "OJT",
  "sender": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": "507f1f77bcf86cd799439011",
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "isRead": false,
  "sentAt": "2025-10-08T10:30:00.000Z"
}
```

**Real-time Events Emitted:**

- `messageSearched` → sent to searching user

## Real-Time Events

### Server to Client Events

#### `newMessage`

Emitted when a user receives a new message.

**Event Data:**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "sender": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe"
  },
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "isRead": false,
  "sentAt": "2025-10-08T10:30:00.000Z"
}
```

---

#### `messageSent`

Emitted to confirm message was successfully sent.

**Event Data:**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "receiver": "507f1f77bcf86cd799439012",
  "content": "Hello! How are you doing with your OJT?",
  "sentAt": "2025-10-08T10:30:00.000Z"
}
```

---

#### `messageRead`

Emitted when a message is marked as read.

**Event Data:**

```json
{
  "messageId": "507f1f77bcf86cd799439013",
  "isRead": true
}
```

---

#### `messageSeen`

Emitted when the receiver views a message.

**Event Data:**

```json
{
  "messageId": "507f1f77bcf86cd799439013",
  "seenBy": "507f1f77bcf86cd799439012",
  "seenAt": "2025-10-08T10:32:00.000Z"
}
```

---

#### `messageViewed`

Emitted when a user views a specific message.

**Event Data:**

```json
{
  "messageId": "507f1f77bcf86cd799439013",
  "viewedAt": "2025-10-08T10:32:00.000Z"
}
```

---

#### `messagesFetched`

Emitted when a user fetches their messages list.

**Event Data:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "messagesCount": 25,
  "fetchedAt": "2025-10-08T10:35:00.000Z"
}
```

---

#### `messageSearched`

Emitted when a user performs a message search.

**Event Data:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "searchQuery": {
    "content": "OJT"
  },
  "resultFound": true,
  "searchedAt": "2025-10-08T10:40:00.000Z"
}
```

### Client to Server Events

#### `join`

Join user to their private room for receiving messages.

**Event Data:**

```javascript
socket.emit("join", userId);
```

**Example:**

```javascript
socket.emit("join", "507f1f77bcf86cd799439011");
```

## Client Integration

### JavaScript/TypeScript Example

```typescript
import { io, Socket } from "socket.io-client";

class MessageClient {
  private socket: Socket;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.socket = io("http://localhost:3000");
    this.setupListeners();
    this.joinRoom();
  }

  private setupListeners() {
    // Listen for new messages
    this.socket.on("newMessage", (message) => {
      console.log("New message received:", message);
      this.displayMessage(message);
    });

    // Listen for message sent confirmation
    this.socket.on("messageSent", (message) => {
      console.log("Message sent successfully:", message);
      this.showSentConfirmation(message);
    });

    // Listen for read receipts
    this.socket.on("messageRead", (data) => {
      console.log("Message read:", data);
      this.updateReadStatus(data.messageId, data.isRead);
    });

    // Listen for message seen notifications
    this.socket.on("messageSeen", (data) => {
      console.log("Message seen:", data);
      this.showSeenIndicator(data.messageId, data.seenAt);
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.joinRoom();
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  private joinRoom() {
    this.socket.emit("join", this.userId);
  }

  // Send message via HTTP API
  async sendMessage(receiverId: string, content: string) {
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          receiver: receiverId,
          content: content,
        }),
      });

      const message = await response.json();
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId: string) {
    try {
      const response = await fetch(`/api/message/${messageId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      const message = await response.json();
      return message;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }

  // Get all messages
  async getMessages() {
    try {
      const response = await fetch("/api/message", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      const messages = await response.json();
      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  private displayMessage(message: any) {
    // Implement your UI message display logic
    console.log(`${message.sender.firstName}: ${message.content}`);
  }

  private showSentConfirmation(message: any) {
    // Show message sent confirmation in UI
    console.log("✓ Message sent");
  }

  private updateReadStatus(messageId: string, isRead: boolean) {
    // Update read status in UI
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement && isRead) {
      messageElement.classList.add("read");
    }
  }

  private showSeenIndicator(messageId: string, seenAt: string) {
    // Show seen indicator in UI
    console.log(`Message ${messageId} seen at ${seenAt}`);
  }

  private getToken(): string {
    // Return your JWT token
    return localStorage.getItem("token") || "";
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const messageClient = new MessageClient("507f1f77bcf86cd799439011");

// Send a message
messageClient.sendMessage("507f1f77bcf86cd799439012", "Hello from client!");
```

### React Hook Example

```tsx
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  _id: string;
  sender: any;
  receiver: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export const useRealTimeMessages = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join", userId);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("newMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("messageSent", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("messageRead", (data: { messageId: string; isRead: boolean }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data.messageId ? { ...msg, isRead: data.isRead } : msg))
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  const sendMessage = async (receiverId: string, content: string) => {
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ receiver: receiverId, content }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return {
    socket,
    messages,
    isConnected,
    sendMessage,
  };
};
```

## Data Models

### Message Model

```typescript
interface MessageModel {
  _id: string;
  sender: ObjectId | User;
  receiver: ObjectId | User;
  content: string;
  isRead: boolean;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Reference

```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "coordinator" | "student";
  avatar?: string;
}
```

## Authentication

All message endpoints require authentication using JWT tokens.

### Required Headers

```http
Authorization: Bearer <your-jwt-token>
```

### Token Payload

```typescript
interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

## Error Handling

### HTTP Error Responses

```json
{
  "error": "Message not found",
  "statusCode": 404,
  "timestamp": "2025-10-08T10:30:00.000Z"
}
```

### Common Error Messages

#### Authentication Errors

- `"Authentication required"`
- `"Invalid token"`
- `"Token expired"`

#### Validation Errors

- `"Message data are required"`
- `"Message ID is required"`
- `"Content is required"`

#### Business Logic Errors

- `"Message not found"`
- `"Unauthorized to mark this message as read"`
- `"Cannot send message to yourself"`

### Socket.IO Error Handling

```javascript
socket.on("connect_error", (error) => {
  console.error("Connection failed:", error);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

## Examples

### Complete Messaging Workflow

#### 1. Connect and Join Room

```javascript
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  // Join user's private room
  socket.emit("join", "user-123");
});
```

#### 2. Send a Message

```javascript
// Send via HTTP API
const sendMessage = async () => {
  try {
    const response = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your-token",
      },
      body: JSON.stringify({
        receiver: "user-456",
        content: "Hello! How is your OJT going?",
      }),
    });

    const message = await response.json();
    console.log("Message sent:", message);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

#### 3. Listen for Real-time Updates

```javascript
// Listen for new messages
socket.on("newMessage", (message) => {
  console.log("New message:", message);
  addMessageToUI(message);
});

// Listen for read receipts
socket.on("messageRead", (data) => {
  console.log("Message read:", data);
  updateMessageStatus(data.messageId, "read");
});

// Listen for seen indicators
socket.on("messageSeen", (data) => {
  console.log("Message seen:", data);
  showSeenIndicator(data.messageId);
});
```

#### 4. Mark Messages as Read

```javascript
const markAsRead = async (messageId) => {
  try {
    const response = await fetch(`/api/message/${messageId}/read`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer your-token",
      },
    });

    const result = await response.json();
    console.log("Marked as read:", result);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Advanced Features

#### Conversation Management

```javascript
// Get conversation between two users
const getConversation = async (userId1, userId2) => {
  try {
    const response = await fetch("/api/message/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your-token",
      },
      body: JSON.stringify({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      }),
    });

    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};
```

#### Message Statistics

```javascript
// Track message activity
socket.on("messagesFetched", (data) => {
  console.log(`User fetched ${data.messagesCount} messages`);
});

socket.on("messageSearched", (data) => {
  console.log(`Search performed: ${JSON.stringify(data.searchQuery)}`);
});
```

## Best Practices

### Performance Optimization

1. **Implement message pagination** for large conversation histories
2. **Use message caching** for frequently accessed conversations
3. **Limit real-time listeners** to active conversations only
4. **Implement connection pooling** for high-traffic scenarios

### Security Considerations

1. **Validate all message content** before storing
2. **Implement rate limiting** for message sending
3. **Sanitize user input** to prevent XSS attacks
4. **Use proper authentication** for all Socket.IO connections

### User Experience

1. **Show typing indicators** when users are composing messages
2. **Implement message status icons** (sent, delivered, read)
3. **Add sound notifications** for new messages
4. **Cache messages locally** for offline viewing

This documentation provides comprehensive coverage of the real-time messaging system, including all API endpoints, Socket.IO events, client integration examples, and best practices for implementation.
