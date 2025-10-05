# Testing Guide for Instagram School Follower Bot

## Before You Start

### Prerequisites
- ✅ Chrome browser installed
- ✅ Instagram account (preferably a test account)
- ✅ Extension loaded in Chrome (see INSTALL.txt)
- ✅ Logged into Instagram

### Safety First

⚠️ **IMPORTANT**: Instagram has strict automation policies. To test safely:

1. **Use a secondary/test Instagram account** - NOT your main account
2. **Start with low limits** - Test with 1-2 follows first
3. **Monitor closely** - Watch the bot in action
4. **Be patient** - Allow the 1-hour wait between follow batches

## Step-by-Step Testing

### Test 1: Basic Functionality (5 minutes)

1. **Open Instagram**
   - Go to https://www.instagram.com
   - Ensure you're logged in

2. **Open the Extension**
   - Click the extension icon in Chrome toolbar
   - You should see the popup with school selection

3. **Select a School**
   - Choose any school from the dropdown
   - Example: "Ahpbathletics (5 accounts, max: 1000)"
   - Note: You can leave "Current Following Count" empty

4. **Start the Bot**
   - Click "Start Following" button
   - A new tab should open with the first Instagram account
   - Example: https://www.instagram.com/ahpbathletics/

5. **Watch the Automation**
   - The bot should automatically:
     - Wait 2-4 seconds (random delay)
     - Click the "Followers" or "팔로워" link
     - Open the followers dialog
     - Start visiting follower profiles

6. **Monitor the Extension**
   - Keep the extension popup open
   - Watch the statistics update:
     - Accounts Processed: 1/5
     - Follows This Hour: 0/5
     - Total Follows: 0/1000

### Test 2: Bio Checking (Watch for 10 minutes)

1. **Observe Profile Visits**
   - The bot will visit follower profiles one by one
   - It checks each bio for keywords (e.g., "ahs", "American", "Heritage")

2. **Check Following Behavior**
   - When a bio contains the keyword, the bot clicks "Follow"
   - Statistics should update: "Follows This Hour: 1/5"
   - The bot then returns to the followers list

3. **Verify Back Navigation**
   - After checking a profile, browser should go back
   - Bot should continue with the next follower

### Test 3: Rate Limiting (1+ hours)

1. **Watch for 5 Follows**
   - Let the bot follow 5 users (may take 15-30 minutes)
   - After the 5th follow, status should say: "Waiting XX minutes"

2. **Verify Wait Period**
   - Bot should pause for approximately 1 hour
   - Extension popup should show: "Follows This Hour: 5/5"

3. **Check Auto-Resume**
   - After 1 hour, the counter should reset: "Follows This Hour: 0/5"
   - Bot should automatically resume following

### Test 4: Account Switching

1. **Let Bot Finish First Account**
   - This may take several hours depending on followers
   - Bot will eventually move to the next Instagram account

2. **Verify Account Change**
   - Status should update: "Moving to account 2/5"
   - Browser should navigate to the second Instagram ID
   - Process repeats: Click followers → Visit profiles → Follow

3. **Check Progress**
   - "Accounts Processed" should increment: 2/5, 3/5, etc.

## What to Watch For

### ✅ Good Signs

- Bot smoothly navigates between pages
- Random delays between actions (appears human-like)
- Statistics update correctly
- Browser history shows visited profiles
- Follows only users with matching keywords in bio

### ❌ Warning Signs

- Instagram shows "Action Blocked" message
- Bot gets stuck on one page for >2 minutes
- Statistics don't update
- Browser console shows errors (F12 > Console)
- Following users without matching keywords

## Debugging

### Open Browser Console

1. Press `F12` or right-click page → "Inspect"
2. Click "Console" tab
3. Look for:
   - `console.log()` messages from the bot
   - Red error messages
   - Instagram API warnings

### Check Extension Console

1. Go to `chrome://extensions/`
2. Find "Instagram School Follower"
3. Click "service worker" link
4. View background script logs

### Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| Bot doesn't start | Not logged into Instagram | Log in first |
| Followers button not clicked | Instagram UI changed | Check `content.js` selectors |
| No profiles followed | Keywords don't match bios | Check CSV abbreviations |
| Action blocked | Too fast/too many follows | Stop bot, wait 24 hours |
| Extension error | Chrome updated | Reload extension |

## Stopping the Test

### Normal Stop

1. Click extension icon
2. Click "Stop" button
3. Bot halts immediately
4. You can resume later by clicking "Start"

### Emergency Stop

1. Close the Instagram tab
2. Disable extension in `chrome://extensions/`
3. Reload the page

## After Testing

### Clean Up

1. **Unfollow Test Accounts** (if needed)
   - Go to your Instagram profile
   - Click "Following"
   - Manually unfollow test accounts

2. **Clear Extension Data**
   - Go to `chrome://extensions/`
   - Click "Remove" on the extension
   - Reinstall to reset all data

3. **Check Instagram Status**
   - Visit https://www.instagram.com
   - Ensure no "Action Blocked" warnings
   - If blocked, wait 24-48 hours

## Production Use Recommendations

Once testing is complete:

1. **Adjust Max Follows**
   - Start with 20-50 per school
   - Gradually increase based on account age and activity

2. **Timing**
   - Run during normal hours (9 AM - 9 PM)
   - Avoid overnight automation

3. **Monitoring**
   - Check every few hours
   - Stop if Instagram shows warnings

4. **Account Safety**
   - Don't run 24/7
   - Take breaks between schools
   - Mix with manual Instagram usage

## Expected Timeline

For reference, here's how long things typically take:

- **Single profile check**: 5-10 seconds
- **Finding 1 matching bio**: 1-5 minutes (varies by school)
- **5 follows (hourly limit)**: 15-45 minutes
- **Complete one account**: 3-8 hours (depends on followers count)
- **Complete one school**: 1-7 days (varies by max follows)

## Getting Help

If something doesn't work:

1. Check this guide's "Common Issues" section
2. Review README.md for detailed documentation
3. Check browser console for specific errors
4. Ensure Instagram hasn't updated their UI
5. Try disabling other Chrome extensions

## Important Reminders

- 🚨 Use a test account for initial testing
- ⏱️ Be patient - automation takes time
- 👀 Monitor the first few hours closely
- 🛑 Stop immediately if Instagram blocks actions
- 📊 Keep track of daily follow counts manually

---

**Happy Testing!** 🎉

Remember: The goal is to automate safely and responsibly. When in doubt, slow down and monitor more closely.


