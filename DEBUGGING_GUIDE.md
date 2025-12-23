# Debugging Guide for Call & Chat Features

## Changes Made

I've added comprehensive debugging to help identify why the "Start Call" button and chat feature aren't working. Here's what was added:

### 1. Socket Connection Debugging (`utils/socket.ts`)
- Added connection event listeners
- Added reconnection configuration
- Logs when socket connects/disconnects
- Logs connection errors

### 2. Call Screen Debugging (`app/call/index.tsx`)
- Added socket connection check before starting call
- Logs socket connection status
- Logs when `join_call_queue` event is emitted
- Fixed TypeScript error with LinearGradient colors

### 3. Chat Screen Debugging (`app/chat/index.tsx`)
- Added socket connection check before searching
- Logs socket connection status
- Logs when `join_call_queue` event is emitted with problem: 'chat'

### 4. Backend Matchmaker Debugging (`backend/socket/matchmaker.js`)
- Logs when `join_call_queue` is received
- Logs queue status
- Logs matching process
- Logs when users are matched

## How to Debug

### Step 1: Check Console Logs

1. **Open the app** and check the console for:
   ```
   🔌 [Socket] Connecting to: <URL>
   ✅ [Socket] Connected! Socket ID: <ID>
   ```

2. **If you see connection errors**:
   ```
   ❌ [Socket] Connection error: <error>
   ```
   - Check that the backend is running
   - Verify the API_URL in `.env` is correct
   - Check your network connection

### Step 2: Test the Call Button

1. **Press "Start Call"** and check for:
   ```
   📞 [Call] Starting call...
   📞 [Call] Socket connected? true
   📞 [Call] Socket ID: <ID>
   📞 [Call] Emitting join_call_queue with problem: none
   ```

2. **If socket is not connected**:
   - You'll see an alert: "Connection error. Please check your internet connection."
   - Check backend logs to see if socket.io is running

3. **Check backend logs** for:
   ```
   📥 [Matchmaker] join_call_queue received from <ID> with problem: none
   🔍 [Matchmaker] <ID> is now searching for none. Queue size: 1
   ```

### Step 3: Test the Chat Feature

1. **Navigate to chat** and check for:
   ```
   🔍 [Chat] Starting search...
   🔍 [Chat] Socket connected? true
   🔍 [Chat] Emitting join_call_queue with problem: chat
   ```

2. **Check backend logs** for:
   ```
   📥 [Matchmaker] join_call_queue received from <ID> with problem: chat
   🔍 [Matchmaker] <ID> is now searching for chat. Queue size: 1
   ```

### Step 4: Test Matching

To test matching, you need **two devices/browsers**:

1. **Device 1**: Start call/chat
2. **Device 2**: Start call/chat
3. **Check logs** for:
   ```
   🤝 [Matchmaker] Matching <ID1> with <ID2> in room <ROOM_ID>
   ✅ [Matchmaker] Match complete! Room: <ROOM_ID>
   ```

## Common Issues

### Issue 1: Socket Not Connecting

**Symptoms:**
- Alert: "Connection error. Please check your internet connection."
- Console: `❌ [Socket] Connection error`

**Solutions:**
1. Check backend is running: `npm run ria` in backend folder
2. Verify `.env` file has correct `EXPO_PUBLIC_API_URL`
3. Check firewall/network settings
4. Try restarting both backend and frontend

### Issue 2: Button Press Does Nothing

**Symptoms:**
- No console logs when pressing button
- No status change

**Solutions:**
1. Check if `TouchableOpacity` is properly bound
2. Verify `startCall` function is being called
3. Check for JavaScript errors in console

### Issue 3: Stuck on "Searching"

**Symptoms:**
- Status changes to "searching" but never connects
- Backend receives `join_call_queue` but no match

**Solutions:**
1. Need two users to match
2. Both users must use same "problem" value
3. Check backend logs for matching errors

### Issue 4: Chat Messages Not Sending

**Symptoms:**
- Messages appear locally but partner doesn't receive

**Solutions:**
1. Check socket connection
2. Verify room ID is correct
3. Check backend `send-chat` handler
4. Look for `recv-chat` event on receiving end

## Environment Variables

Make sure your `.env` files are configured correctly:

### Frontend (`.env`)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_key>
EXPO_PUBLIC_API_URL=https://detalkss-1.onrender.com/
```

### Backend (`.env`)
```
PORT=4040
CLERK_PUBLISHABLE_KEY=<your_key>
CLERK_SECRET_KEY=<your_secret>
MONGODB_URI=<your_mongodb_uri>
```

## Next Steps

1. **Restart both servers** to apply the debugging changes
2. **Open the app** and check console logs
3. **Try pressing the call button** and observe logs
4. **Try the chat feature** and observe logs
5. **Report back** with the console output if issues persist

## Log Symbols Reference

- 🔌 Socket connection
- ✅ Success
- ❌ Error
- 📞 Call-related
- 🔍 Search/matching
- 🤝 Match found
- 📥 Event received
- ⚠️ Warning
- ℹ️ Information
