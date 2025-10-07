# 12-Hour Break Test Mode Guide

## Overview
The new **Break Test Mode** allows you to test the 12-hour break functionality by following [@anna_calbos](https://www.instagram.com/anna_calbos/) and then automatically triggering a break. This is perfect for testing the break system without waiting for a real Instagram error.

## How to Use Break Test Mode

### 1. Enable Break Test Mode
1. Open the extension popup
2. Enter your Instagram username
3. Check the **"⏰ 12-Hour Break Test Mode"** checkbox
4. Click **"Start Following"**

### 2. What Happens
The bot will automatically:
1. Navigate to [@anna_calbos](https://www.instagram.com/anna_calbos/) profile
2. Follow the profile (if not already following)
3. Trigger a 12-hour break immediately after following
4. Display break status in the popup
5. Resume automatically after 12 hours

### 3. Testing the Break System

#### Quick Test (2 minutes)
For quick testing, you can manually trigger a short break:
```javascript
// Run this in browser console on any Instagram page
test12HourBreak(2) // 2-minute break for testing
```

#### Full Test (12 hours)
Use the Break Test Mode checkbox in the popup for the full 12-hour experience.

## Console Logs to Watch For

### Break Test Mode Initialization
```
⏰ BREAK TEST MODE INITIALIZED
⏰ Break test profile: @anna_calbos
⏰ This mode will:
   1. Navigate to @anna_calbos profile
   2. Follow the profile
   3. Trigger 12-hour break automatically
⏰ Perfect for testing the break functionality!
```

### During Execution
```
⏰ BREAK TEST MODE: Testing 12-hour break functionality
⏰ BREAK TEST MODE: Navigating to @anna_calbos
⏰ BREAK TEST MODE: On @anna_calbos profile page
⏰ BREAK TEST MODE: Attempting to follow @anna_calbos
⏰ BREAK TEST MODE: Successfully followed @anna_calbos
⏰ BREAK TEST MODE: Triggering 12-hour break after following @anna_calbos
🚨 TRY AGAIN LATER ERROR - Starting 12-hour break
⏰ Break will end at: [timestamp]
```

### Break Status
```
⏳ Still on 12-hour break - 11h 58m remaining
```

### Break Completion
```
✅ 12-hour break completed - resuming automation
```

## UI Elements to Check

### Popup Status
- Status message should show: `"⏰ BREAK TEST MODE: Followed @anna_calbos, triggering 12-hour break"`
- Break status box should appear with remaining time
- Start button should be hidden, Stop button should be visible

### Break Status Display
```
🚨 12-Hour Break Active
Remaining: 11h 58m
Resumes: [timestamp]
```

## Testing Scenarios

### Scenario 1: Full Break Test
1. Enable Break Test Mode
2. Start the bot
3. Verify it follows @anna_calbos
4. Confirm 12-hour break starts
5. Check break status in popup
6. Wait 12 hours (or use `test12HourBreak(1)` for 1-minute test)
7. Verify bot resumes automatically

### Scenario 2: Quick Break Test
1. Open Instagram in browser
2. Open browser console
3. Run: `test12HourBreak(2)`
4. Check popup shows break status
5. Wait 2 minutes
6. Verify bot resumes automatically

### Scenario 3: Error Detection Test
1. Open Instagram in browser
2. Open browser console
3. Run: `testTryAgainLaterError()`
4. Verify error detection works
5. Mock elements are cleaned up after 5 seconds

## Expected Behavior

### During Break
- Bot should be completely inactive
- Popup should show break status
- Console should show remaining time
- No automation should occur

### After Break
- Bot should automatically resume
- Status should update to "12-hour break completed"
- Normal automation should continue
- Break status should disappear from popup

## Troubleshooting

### Bot Doesn't Follow @anna_calbos
- Check if already following
- Verify profile is accessible
- Check console for navigation errors

### Break Doesn't Start
- Verify Break Test Mode is enabled
- Check console for error messages
- Ensure config is properly saved

### Break Doesn't Resume
- Check Chrome alarms permission
- Verify break end time is correct
- Check console for alarm trigger messages

### UI Issues
- Refresh popup to see updated status
- Check if break status element exists in HTML
- Verify CSS styling is applied

## Manual Override

If you need to manually end a break:
```javascript
// Run in browser console
chrome.runtime.sendMessage({
  action: 'updateConfig',
  updates: {
    isOn12HourBreak: false,
    breakStartTime: null,
    breakEndTime: null,
    active: true,
    status: 'Break manually ended',
    statusType: 'info'
  }
});
```

## Notes

- The Break Test Mode only works with @anna_calbos profile
- Break duration is fixed at 12 hours in normal mode
- Test mode allows custom break durations via console
- Break status persists across browser restarts
- Chrome extension must remain installed for alarms to work
