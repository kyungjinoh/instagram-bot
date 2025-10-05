# 🚀 Getting Started - Quick Setup Guide

Welcome! This Chrome extension automates Instagram following for school-related accounts. Here's how to get started in 5 minutes.

## 📋 Quick Checklist

Before you begin:
- [ ] Chrome browser installed
- [ ] Instagram account ready (test account recommended)
- [ ] Logged into Instagram
- [ ] 5 minutes of time

## 🔧 Installation (2 minutes)

### 1. Open Chrome Extensions Page
```
Type in address bar: chrome://extensions/
```
Or: Menu (⋮) → More Tools → Extensions

### 2. Enable Developer Mode
- Look at the **top-right corner**
- Toggle **"Developer mode"** to ON
- You should see new buttons appear

### 3. Load the Extension
- Click **"Load unpacked"** button
- Navigate to this folder and select it:
  ```
  /Users/kyungjinoh/Desktop/Coding/Instagram bot bot
  ```
- Click **"Select Folder"** or **"Open"**

### 4. Verify Installation
- You should see "Instagram School Follower" appear in the list
- There should be NO errors
- The extension should be **enabled** (toggle is blue/on)

### 5. Pin to Toolbar (Optional but Recommended)
- Click the puzzle piece icon 🧩 in Chrome toolbar
- Find "Instagram School Follower"
- Click the pin 📌 icon next to it
- The extension icon should now appear in your toolbar

## 🎯 First Use (3 minutes)

### 1. Log Into Instagram
```
https://www.instagram.com
```
Make sure you're fully logged in (can see your feed)

### 2. Open the Extension
- Click the extension icon in your Chrome toolbar
- A popup should appear with a clean, purple-gradient interface

### 3. Select a School
- Click the **"Select School"** dropdown
- You'll see options like:
  - American Heritage Schools (5 accounts)
  - The Dalton School (6 accounts)
  - The Quarry Lane School (7 accounts)
  - ... and more

### 4. (Optional) Enter Current Following Count
- If you want to track your total following growth
- Enter a number like `250`
- Can leave blank if you don't care

### 5. (Optional) Select Starting Account
- Choose which Instagram account to start from
- Useful if you want to resume from a specific account
- Leave as "-- Start from first account --" to begin from the beginning
- Shows all accounts for the selected school (e.g., "awtyvarsitytennis (Account 1)")

### 6. Start the Bot!
- Click the big **"Start Following"** button
- A new tab will open with the first Instagram account
- **Watch it work!** 🎉

## 📊 What Happens Next?

The bot will automatically:

1. **Navigate** to the first Instagram account from your selected school
2. **Click** the "Followers" button
3. **Scroll & Collect** - Scrolls through the ENTIRE followers list and stores all usernames
4. **Visit Profiles** - Systematically visits each follower's profile from the collected list
5. **Check Bios** - Checks their bio for school-related keywords
6. **Follow** - Follows them if keywords match
7. **Wait** - After 5 follows, waits 1 hour (respects Instagram's limits)
8. **Next Account** - Moves to next account when all followers are processed
9. **Continue** - Repeats until all accounts are done

### Timeline Expectations

- **First follow**: 2-5 minutes (depending on finding matches)
- **5 follows**: 15-45 minutes (then waits 1 hour)
- **One complete school**: Several hours to days (varies)

## 🎮 Controls

### While Running
- Open the extension popup to see live statistics
- **Accounts Processed**: Which account it's on (e.g., 2/5)
- **Follows This Hour**: How many followed in last hour (max 5)
- **Total Follows**: Total for this school (e.g., 23/1000)

### To Stop
- Click extension icon
- Click red **"Stop"** button
- Bot stops immediately

### To Resume
- Click extension icon
- Click **"Start Following"** again
- Continues where it left off

### To Resume from Specific Account
- If bot stopped mid-way, you can resume from any account
- Select the same school
- Choose the account you want to start from in the dropdown
- Click **"Start Following"**
- Bot will start from that account instead of the beginning

## ⚠️ Important Rules

### The 5-Per-Hour Rule
- Instagram limits automated actions
- Bot follows max 5 people per hour
- After 5th follow, automatically waits 1 hour
- **DO NOT** try to bypass this - it's for your safety

### Daily Limit Protection
- Bot automatically detects Instagram's daily limit popup
- When "You've reached your daily limit" appears, bot automatically closes it
- Bot continues running and will resume when limits reset
- No manual intervention needed when daily limits are hit

### Max Follows Per School
- Each school has a maximum (from CSV)
- Bot stops when limit reached
- Prevents excessive following

### Keep Tab Open
- Don't close the Instagram tab
- Bot needs the page open to work
- You can use other tabs, just keep Instagram open

## 📱 Example Session

Here's what a typical session looks like:

```
[10:00 AM] You: Select "American Heritage Schools", choose "ahs_info_stuco (Account 2)", click Start
[10:01 AM] Bot: Opens ahs_info_stuco, clicks Followers
[10:02 AM] Bot: Visits follower "john_doe_123"
[10:02 AM] Bot: Checks bio... contains "ahs" ✓
[10:02 AM] Bot: Clicks Follow! (1/5 this hour)
[10:03 AM] Bot: Back to followers list
[10:04 AM] Bot: Visits follower "jane_smith_456"
[10:04 AM] Bot: Checks bio... no keywords ✗
[10:05 AM] Bot: Back to followers list (didn't follow)
[10:06 AM] Bot: Continues...
[10:20 AM] Bot: Follow #5 completed (5/5 this hour)
[10:20 AM] Bot: "Waiting 60 minutes..."
[11:20 AM] Bot: Auto-resumes, counter resets (0/5)
```

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Extension won't load | Make sure Developer Mode is ON |
| Bot doesn't start | Log into Instagram first |
| No follows happening | Keywords might not match bios |
| "Action Blocked" on Instagram | Stop bot, wait 24 hours |
| "Daily limit reached" popup | Bot automatically closes it - no action needed |
| Extension icon missing | Click puzzle 🧩, pin it |

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Installation Help**: See `INSTALL.txt`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Your CSV Data**: See `google sheet.csv`

## 🎓 Understanding the Schools

Your CSV has these schools loaded:

1. **American Heritage Schools** - Keywords: ahs, American, Heritage (5 accounts)
2. **The Dalton School** - Keywords: dalton, ds, tds (6 accounts)
3. **The Quarry Lane School** - Keywords: qls, Quarry Lane, Quarry (7 accounts)
4. **Ethical Culture Fieldston School** - Keywords: ecfs, fieldston (4 accounts)
5. **Blair Academy** - Keywords: blair, BA (5 accounts)
6. **The Village School** - Keywords: vhs, vilage, viking (6 accounts)
7. **Ransom Everglades School** - Keywords: RE, Ransom Everglades (6 accounts)
8. **Milton Academy** - Keywords: MA, milton (8 accounts)
9. **The Awty International School** - Keywords: ais, awty (6 accounts)
10. **Georgetown Day School** - Keywords: Georgetown Day School, gds (7 accounts)

## 🎉 You're Ready!

That's it! You now know:
- ✅ How to install the extension
- ✅ How to start the bot
- ✅ What to expect
- ✅ How to monitor progress
- ✅ How to stop when needed

**Pro Tip**: For your first run, choose a school with fewer accounts (like "Blair Academy" with 5 accounts) to see the full process faster.

## 🆘 Need Help?

1. Check the error message (if any)
2. Look at browser console (F12 → Console)
3. Review `TESTING_GUIDE.md` for detailed debugging
4. Make sure Instagram's UI hasn't changed

---

**Ready to start?** Follow the steps above and click "Start Following"! 🚀

*Remember: Be responsible with automation. Use a test account first, respect rate limits, and monitor closely.*

