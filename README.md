# Instagram School Follower Bot 📸

A Chrome extension that automates Instagram following for school-related accounts based on CSV configuration. The extension respects Instagram's rate limits and follows accounts intelligently based on bio keywords.

## Features

✅ **Automated Following**: Automatically follows accounts based on bio keywords  
✅ **Rate Limiting**: Respects 5 follows per hour to avoid Instagram restrictions  
✅ **CSV Configuration**: Easy to manage multiple schools and their settings  
✅ **Smart Bio Checking**: Only follows users whose bios contain specified keywords  
✅ **Progress Tracking**: Real-time statistics and status updates  
✅ **Fully Automated**: Runs in background without user interaction  
✅ **Multi-Account Support**: Process multiple Instagram accounts per school  

## Installation

### Step 1: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the folder containing this extension: `/Users/kyungjinoh/Desktop/Coding/Instagram bot bot`

### Step 2: Pin the Extension

1. Click the puzzle piece icon 🧩 in Chrome toolbar
2. Find "Instagram School Follower" 
3. Click the pin icon to keep it visible

## Usage

### Starting the Bot

1. **Click the extension icon** in your Chrome toolbar
2. **Select a school** from the dropdown menu
   - Each option shows: School name, number of accounts, and max follows
   - Example: "Ahpbathletics (5 accounts, max: 1000)"
3. **(Optional)** Enter your current following count
4. **Click "Start Following"**
5. The extension will automatically:
   - Open the first Instagram account
   - Click on the followers list
   - Visit each follower's profile
   - Check their bio for school keywords
   - Follow if keywords match
   - Respect the 5 follows/hour limit
   - Move to next account when done

### Monitoring Progress

The popup shows real-time statistics:
- **Current School**: Which school is being processed
- **Accounts Processed**: Current account / Total accounts
- **Follows This Hour**: Current hourly follows / 5 limit
- **Total Follows**: Total follows / Max limit for school

### Stopping the Bot

1. Click the extension icon
2. Click the **"Stop"** button (red)
3. The bot will halt immediately

## How It Works

### Workflow

1. **Account Selection**: Opens the selected school's first Instagram account
2. **Followers Access**: Clicks the "Followers" button to open the followers list
3. **Followers Collection**: Scrolls down the entire followers list and collects ALL follower usernames
4. **Profile Visiting**: Visits each collected follower's profile systematically
5. **Bio Verification**: Checks if the bio contains any of the school's keywords
6. **Following**: If keywords match, clicks the "Follow" button
7. **Rate Limiting**: After 5 follows, waits 1 hour before continuing
8. **Account Progression**: Moves to next Instagram account when all followers are processed
9. **Completion**: Stops when all accounts are processed

**Key Improvement**: The bot now collects ALL followers first before visiting any profiles, making the process more efficient and organized.

### CSV Configuration

The bot uses the embedded CSV data with this structure:

| School Name | Instagram ID | Abbreviation |
|-------------|--------------|--------------|
| Official school name | Comma-separated account names | Comma-separated keywords |

Example:
```csv
American Heritage Schools,"ahpbathletics, ahs_info_stuco, ahpbboyssoccer","ahs, American, Heritage"
```

This means:
- School name: American Heritage Schools
- Visit followers of: ahpbathletics, ahs_info_stuco, ahpbboyssoccer
- Follow users whose bio contains: "ahs", "American", or "Heritage"
- No limit on total follows (only limited by 5 follows per hour rate limit)

### Rate Limiting

The bot respects Instagram's limits:
- **5 follows per hour**: After 5 follows, automatically waits 1 hour
- **No total follow limit**: Bot continues until all accounts are processed
- **Random delays**: 2-5 seconds between actions to appear human-like
- **Smart scrolling**: Gradually loads more followers to avoid suspicion

## Important Notes

### Instagram Guidelines

⚠️ **Use Responsibly**: This bot is for educational purposes. Excessive automation may violate Instagram's Terms of Service and could result in:
- Temporary action blocks
- Account restrictions
- Permanent account suspension

### Best Practices

1. **Don't exceed limits**: Stick to the 5 follows/hour rule
2. **Use a test account**: Test with a non-primary Instagram account first
3. **Monitor activity**: Keep the extension popup open to watch progress
4. **Stay logged in**: Ensure you're logged into Instagram before starting
5. **Check manually**: Periodically verify the bot is working correctly

### Limitations

- Requires Chrome browser
- Must stay on Instagram tab for automation to work
- Instagram's UI changes may affect functionality
- Works best with public profiles
- May not work if Instagram updates their HTML structure

## Troubleshooting

### Bot Not Starting

- Ensure you're logged into Instagram
- Refresh the Instagram page
- Check that Developer mode is enabled in chrome://extensions/
- Try disabling and re-enabling the extension

### Bot Not Following Anyone

- Check that bio keywords match the school's abbreviations (case-insensitive)
- Verify you haven't hit the hourly or total limit
- Make sure profiles are public
- Check browser console for errors (F12 > Console tab)

### Bot Stops Unexpectedly

- Instagram may have rate-limited your account (wait a few hours)
- Check if you've reached max follows for the school
- Browser may have updated - reload the extension

## Technical Details

### Files Structure

```
Instagram bot bot/
├── manifest.json       # Extension configuration
├── popup.html         # User interface
├── popup.js           # UI logic and CSV parsing
├── background.js      # Background service worker
├── content.js         # Instagram page automation
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
├── icon128.png        # Extension icon (128x128)
├── google sheet.csv   # School data (reference)
└── README.md          # This file
```

### Technologies Used

- **Manifest V3**: Latest Chrome extension format
- **Chrome Storage API**: Persistent configuration storage
- **Content Scripts**: Direct Instagram page interaction
- **Service Worker**: Background monitoring and state management
- **Vanilla JavaScript**: No external dependencies

## Updating Schools

To add or modify schools:

1. Open `popup.js`
2. Find the `CSV_DATA` constant
3. Add/modify rows following the format:
   ```
   "instagram_id1, instagram_id2","keyword1, keyword2",1000
   ```
4. Reload the extension in chrome://extensions/

## Privacy & Security

- **No data collection**: All data stays local on your device
- **No external requests**: Only communicates with Instagram
- **Open source**: Full code available for review
- **No passwords stored**: Uses your existing Instagram login

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console for error messages (F12)
3. Ensure Instagram hasn't changed their UI structure

## License

This project is for educational purposes only. Use at your own risk.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Compatibility**: Chrome 88+

