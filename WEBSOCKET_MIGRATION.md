# WebSocket Migration Summary

This document outlines the migration from Server-Sent Events (SSE) to WebSocket for real-time communication in CoLabManager.

## Changes Made

### 1. Server-Side Realtime Broadcaster (`src/lib/server/realtime.ts`)

**Before (SSE):**
- Used `SSEConnection` interface with `ReadableStreamDefaultController`
- Sent messages using `controller.enqueue()` with SSE format
- Limited to unidirectional communication

**After (WebSocket):**
- Updated to `WebSocketConnection` interface with `WebSocket` from 'ws' library
- Sends messages using `socket.send()` with JSON format
- Supports bidirectional communication
- Added ping/pong for connection health monitoring
- Improved error handling and automatic cleanup

### 2. WebSocket Server (`src/hooks.server.ts`)

**New WebSocket Server Features:**
- Dedicated WebSocket server on port 3001
- Authentication via session tokens in query parameters
- Project-based authorization
- Automatic connection cleanup on errors
- Bidirectional message handling (ping/pong, echo test)
- Periodic ping to maintain connections

### 3. Client Store (`src/lib/stores/realtime.ts`)

**Enhanced Client Features:**
- Automatic WebSocket preference with SSE fallback
- Improved reconnection logic with exponential backoff
- Bidirectional communication methods (`send()`, `testBidirectional()`)
- Connection type detection (`getConnectionType()`)
- Better error handling and user feedback

### 4. Endpoint Updates (`src/routes/api/projects/[id]/realtime/+server.ts`)

**Hybrid Approach:**
- Maintains SSE support for backward compatibility
- Detects WebSocket upgrade requests
- Uses mock WebSocket interface for SSE fallback
- Consistent API regardless of transport method

## Key Benefits

### 1. **Bidirectional Communication**
- Clients can now send messages to the server
- Real-time user presence indicators possible
- Interactive features like typing indicators
- Client-initiated actions (e.g., cursor sharing)

### 2. **Better Performance**
- Lower overhead compared to SSE
- More efficient message framing
- Built-in compression support
- Better handling of network interruptions

### 3. **Enhanced Reliability**
- Automatic ping/pong for connection health
- Better error detection and recovery
- Graceful fallback to SSE when WebSocket fails
- Improved reconnection strategies

### 4. **Scalability**
- More efficient server resource usage
- Better support for high-frequency updates
- Reduced memory footprint per connection
- Native browser support without polyfills

## Connection Flow

### WebSocket Connection (Primary)
1. Client attempts WebSocket connection to `ws://host:3001/ws?projectId=X&session=Y`
2. Server validates session and project membership
3. If successful, WebSocket connection established
4. If failed, client falls back to SSE

### SSE Fallback (Secondary)
1. Client connects to `/api/projects/[id]/realtime` via EventSource
2. Server creates mock WebSocket interface for SSE
3. Messages sent in SSE format for compatibility
4. Limited to unidirectional communication

## Testing

### Manual Testing Steps
1. Start the development server: `yarn dev`
2. Open browser developer tools
3. Navigate to a project page
4. Check Network tab for WebSocket connection
5. Monitor Console for connection logs
6. Test real-time updates by creating/updating tasks

### Bidirectional Communication Test
```javascript
// In browser console:
const store = realtimeStore;
console.log('Connection type:', store.getConnectionType());
console.log('Is bidirectional:', store.isBidirectional());
await store.testBidirectional(); // Should return true for WebSocket
```

## Configuration

### WebSocket Server Settings
- **Port**: 3001 (configurable)
- **Path**: `/ws`
- **Heartbeat**: 30 seconds
- **Authentication**: Session-based with project verification

### Client Settings
- **Reconnect Attempts**: 5 maximum
- **Reconnect Interval**: 5 seconds (exponential backoff)
- **WebSocket Preference**: Enabled by default
- **SSE Fallback**: Automatic on WebSocket failure

## Migration Notes

### Backward Compatibility
- Existing SSE clients continue to work
- No changes required to UI components
- Same RealtimeEvent interface maintained
- Gradual migration possible

### Production Considerations
- WebSocket server should run on same host as main app
- Consider load balancer WebSocket support
- Monitor connection counts and resource usage
- Implement proper error logging and monitoring

### Future Enhancements
- User presence indicators
- Typing indicators for collaborative editing
- Real-time cursor sharing
- Voice/video call integration
- File collaboration features

## Troubleshooting

### Common Issues
1. **WebSocket connection fails**: Check port 3001 availability
2. **Authentication errors**: Verify session token validity
3. **Connection drops**: Check network stability and firewall settings
4. **High resource usage**: Monitor connection cleanup and heartbeat frequency

### Debug Tools
- Browser Network tab shows WebSocket connections
- Console logs connection state changes
- Server logs show connection events and errors
- Use `realtimeStore.getConnectionType()` to check active transport