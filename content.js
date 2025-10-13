// Content script that runs on Instagram pages
(function() {
  'use strict';
  
  let config = null;
  let isProcessing = false;
  let isScrollingFollowers = false;
  let lastNavigationTime = 0;
  let navigationCount = 0;
  let lastProfileVisitTime = 0;
  let processedAccountsCount = 0;
  let profilesCheckedWithoutFollow = 0;
  let lastFollowTime = 0;
  
  // Utility: Wait for a random time to appear more human-like
  function randomDelay(min = 2000, max = 5000) {
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * (max - min) + min);
    });
  }

  // Rate limiting: Check if enough time has passed since last profile visit
  function canVisitProfile() {
    const now = Date.now();
    const timeSinceLastVisit = now - lastProfileVisitTime;
    const requiredDelay = 30000; // 30 seconds between profile visits
    
    console.log(`🔍 Rate limit check - Last visit: ${lastProfileVisitTime}, Now: ${now}, Time since: ${timeSinceLastVisit}ms, Required: ${requiredDelay}ms`);
    
    if (timeSinceLastVisit < requiredDelay) {
      const remainingTime = Math.ceil((requiredDelay - timeSinceLastVisit) / 1000);
      console.log(`⏳ Rate limit: Waiting ${remainingTime} more seconds before next profile visit`);
      return false;
    }
    
    console.log(`✅ Rate limit passed - ${timeSinceLastVisit}ms since last visit (required: ${requiredDelay}ms)`);
    return true;
  }

  // Break logic: Check if we need a break after every 5 accounts
  async function checkForBreak() {
    processedAccountsCount++;
    
    if (processedAccountsCount % 5 === 0) {
      console.log(`🛑 Break time! Processed ${processedAccountsCount} accounts. Taking 1-minute break...`);
      
      await updateConfig({
        status: `Taking 1-minute break after ${processedAccountsCount} accounts`,
        statusType: 'info'
      });
      
      // 1-minute break
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      console.log('✅ Break completed, resuming automation...');
      
      await updateConfig({
        status: 'Break completed, resuming automation',
        statusType: 'success'
      });
    }
  }
  
  // Utility: Wait for element to appear
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  
  // Safe navigation function to prevent infinite loops
  function safeNavigate(url) {
    const now = Date.now();
    
    // Reset navigation count if it's been more than 30 seconds since last navigation
    if (now - lastNavigationTime > 30000) {
      navigationCount = 0;
    }
    
    // Prevent too many rapid navigations (anti-loop protection)
    if (navigationCount >= 3 && (now - lastNavigationTime) < 15000) {
      console.log('🚨 ANTI-LOOP: Too many rapid navigations detected. Stopping bot to prevent infinite loop.');
      chrome.runtime.sendMessage({ 
        action: 'updateConfig', 
        updates: { 
          active: false,
          status: 'Stopped due to navigation loop detected',
          statusType: 'error'
        } 
      });
      return false;
    }
    
    navigationCount++;
    lastNavigationTime = now;
    console.log(`🧭 Navigating to: ${url} (navigation #${navigationCount})`);
    window.location.href = url;
    return true;
  }
  
  // Check for and close daily limit popup
  function checkAndCloseDailyLimitPopup() {
    // Look for various daily limit indicators
    const dailyLimitTexts = [
      "You've reached your daily limit",
      "Daily limit reached",
      "You've hit your daily limit",
      "Action blocked",
      "Try again later",
      "Too many requests"
    ];
    
    // Check for daily limit heading
    const headings = document.querySelectorAll('h1, h2, h3, div[role="heading"]');
    let dailyLimitDetected = false;
    let dailyLimitText = '';
    
    for (const heading of headings) {
      const text = heading.textContent.toLowerCase();
      for (const limitText of dailyLimitTexts) {
        if (text.includes(limitText.toLowerCase())) {
          dailyLimitDetected = true;
          dailyLimitText = heading.textContent;
          break;
        }
      }
      if (dailyLimitDetected) break;
    }
    
    if (dailyLimitDetected) {
      console.log(`🚨 DAILY LIMIT DETECTED: "${dailyLimitText}"`);
      
      // Try multiple close button selectors
      const closeButtonSelectors = [
        'div[role="button"][tabindex="0"] svg[aria-label="close"]',
        'button svg[aria-label="close"]',
        'div[role="button"] svg[aria-label="close"]',
        'svg[aria-label="close"]',
        'button[aria-label="close"]',
        '[data-testid="close-button"]',
        '.close-button'
      ];
      
      let closeButton = null;
      for (const selector of closeButtonSelectors) {
        closeButton = document.querySelector(selector);
        if (closeButton) {
          console.log(`✅ Found close button with selector: ${selector}`);
          break;
        }
      }
      
      if (closeButton) {
        // Click the close button (try different ways to click it)
        try {
          if (closeButton.closest('div[role="button"]')) {
            closeButton.closest('div[role="button"]').click();
          } else if (closeButton.closest('button')) {
            closeButton.closest('button').click();
          } else {
            closeButton.click();
          }
          
          console.log('✅ DAILY LIMIT POPUP CLOSED: Clicked the close button');
          
          // Notify the background script about the daily limit
          chrome.runtime.sendMessage({ 
            action: 'updateConfig', 
            updates: { 
              status: 'Daily limit reached - popup closed. Bot will continue when limit resets.',
              statusType: 'warning'
            } 
          });
          
          return true;
        } catch (error) {
          console.log('⚠️ Error clicking close button:', error);
        }
      } else {
        console.log('⚠️ DAILY LIMIT DETECTED but close button not found');
        
        // Try pressing Escape key as fallback
        try {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
          console.log('⌨️ Tried pressing Escape key as fallback');
          return true;
        } catch (error) {
          console.log('⚠️ Error pressing Escape key:', error);
        }
      }
    }
    
    return false;
  }
  
  // Check for "no followers" message in followers dialog
  function checkForNoFollowersMessage() {
    // Look for the specific "You'll see all the people who follow you here" message
    const noFollowersSelectors = [
      'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
      'span[class*="x1lliihq"][class*="x1plvlek"][class*="xryxfnj"]',
      'span[dir="auto"]'
    ];
    
    for (const selector of noFollowersSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (text === "You'll see all the people who follow you here." || 
            text === "You'll see all the people who follow you here") {
          console.log(`🚨 NO FOLLOWERS MESSAGE DETECTED: "${text}"`);
          return true;
        }
      }
    }
    
    // Fallback: check all spans
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      const text = span.textContent.trim();
      if (text.includes("You'll see all the people who follow you here")) {
        console.log(`🚨 NO FOLLOWERS MESSAGE DETECTED (fallback): "${text}"`);
        return true;
      }
    }
    
    return false;
  }
  
  // Check for "Try Again Later" or rate limit errors with specific CSS classes
  function checkForTryAgainLaterError() {
    // Look for the specific "Try Again Later" or "Your request is pending" headings
    const errorHeadingSelectors = [
      'h3.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.x1ms8i2q.xo1l8bm.x5n08af.x4zkp8e.xw06pyt.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
      'h3[class*="x1lliihq"][class*="x1plvlek"][class*="xryxfnj"]',
      'h3[dir="auto"][tabindex="-1"]'
    ];
    
    for (const selector of errorHeadingSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        
        // Check for "Try Again Later" error
        if (text === 'Try Again Later') {
          console.log(`🚨 TRY AGAIN LATER ERROR DETECTED: "${text}"`);
          
          // Check for confirmation description
          const descriptionSelectors = [
            'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x1roi4f4.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
            'span[class*="x1lliihq"][class*="x1plvlek"][class*="xryxfnj"]',
            'span[dir="auto"]'
          ];
          
          let foundDescription = false;
          for (const descSelector of descriptionSelectors) {
            const descElements = document.querySelectorAll(descSelector);
            for (const descElement of descElements) {
              const descText = descElement.textContent.trim();
              if (descText.includes('We limit how often you can do certain things') || 
                  descText.includes('protect our community')) {
                foundDescription = true;
                console.log(`✅ Rate limit description confirmed: "${descText}"`);
                break;
              }
            }
            if (foundDescription) break;
          }
          
          if (foundDescription) {
            console.log('🚨 RATE LIMIT ERROR CONFIRMED - Initiating 4-hour break');
            return true;
          }
        }
        
        // Check for "Your request is pending" error (also a rate limit indicator)
        if (text === 'Your request is pending') {
          console.log(`🚨 REQUEST PENDING ERROR DETECTED: "${text}"`);
          
          // Check for confirmation description
          const descriptionSelectors = [
            'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x1roi4f4.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
            'span[class*="x1lliihq"][class*="x1plvlek"][class*="xryxfnj"]',
            'span[dir="auto"]'
          ];
          
          let foundDescription = false;
          for (const descSelector of descriptionSelectors) {
            const descElements = document.querySelectorAll(descSelector);
            for (const descElement of descElements) {
              const descText = descElement.textContent.trim();
              if (descText.includes('Some accounts prefer to manually review') || 
                  descText.includes('Let us know if you think we made a mistake')) {
                foundDescription = true;
                console.log(`✅ Request pending description confirmed: "${descText}"`);
                break;
              }
            }
            if (foundDescription) break;
          }
          
          if (foundDescription) {
            console.log('🚨 REQUEST PENDING ERROR CONFIRMED - Initiating 4-hour break');
            return true;
          }
        }
      }
    }
    
    // Fallback: check all headings for error text
    const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, div[role="heading"]');
    for (const heading of allHeadings) {
      const text = heading.textContent.trim();
      if (text === 'Try Again Later' || text === 'Your request is pending') {
        console.log(`🚨 RATE LIMIT ERROR DETECTED (fallback): "${text}"`);
        return true;
      }
    }
    
    return false;
  }
  
  // Handle 6-hour break when "Try Again Later" error is detected
  async function handle6HourBreak() {
    const breakEndTime = Date.now() + (6 * 60 * 60 * 1000); // 6 hours from now
    const breakEndDate = new Date(breakEndTime);
    
    console.log(`🚨 TRY AGAIN LATER ERROR - Starting 6-hour break`);
    console.log(`⏰ Break will end at: ${breakEndDate.toLocaleString()}`);
    
    // Store break information in config
    await updateConfig({
      active: false,
      isOn6HourBreak: true,
      breakStartTime: Date.now(),
      breakEndTime: breakEndTime,
      status: `6-hour break started due to "Try Again Later" error. Resuming at ${breakEndDate.toLocaleString()}`,
      statusType: 'warning'
    });
    
    // Set up a one-time alarm to resume after 6 hours
    chrome.runtime.sendMessage({
      action: 'setBreakAlarm',
      breakEndTime: breakEndTime
    });
    
    return true;
  }
  
  // Handle 4-hour break when rate limited (Try Again Later error)
  async function handle4HourBreakRateLimit() {
    const breakEndTime = Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now
    const breakEndDate = new Date(breakEndTime);
    
    console.log(`🚨 RATE LIMIT ERROR - Starting 4-hour break`);
    console.log(`⏰ Break will end at: ${breakEndDate.toLocaleString()}`);
    
    // Store break information in config
    await updateConfig({
      active: false,
      isOn6HourBreak: true, // Reuse same break flag
      breakStartTime: Date.now(),
      breakEndTime: breakEndTime,
      status: `4-hour break: Rate limited by Instagram. Resuming at ${breakEndDate.toLocaleString()}`,
      statusType: 'warning'
    });
    
    // Set up a one-time alarm to resume after 4 hours
    chrome.runtime.sendMessage({
      action: 'setBreakAlarm',
      breakEndTime: breakEndTime
    });
    
    return true;
  }
  
  // Handle 4-hour break when no follows after 50 profiles checked
  async function handle4HourBreakNoMatches() {
    const breakEndTime = Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now
    const breakEndDate = new Date(breakEndTime);
    
    console.log(`🚨 NO MATCHES AFTER 50 PROFILES - Starting 4-hour break`);
    console.log(`⏰ Break will end at: ${breakEndDate.toLocaleString()}`);
    
    // Store break information in config
    await updateConfig({
      active: false,
      isOn6HourBreak: true, // Reuse same break flag
      breakStartTime: Date.now(),
      breakEndTime: breakEndTime,
      status: `4-hour break: No matches found in 50 profiles. Resuming at ${breakEndDate.toLocaleString()}`,
      statusType: 'warning'
    });
    
    // Reset counter after break
    profilesCheckedWithoutFollow = 0;
    
    // Set up a one-time alarm to resume after 4 hours
    chrome.runtime.sendMessage({
      action: 'setBreakAlarm',
      breakEndTime: breakEndTime
    });
    
    return true;
  }
  
  // Check if we're currently on a 6-hour break
  function isOn6HourBreak() {
    if (!config || !config.isOn6HourBreak) {
      return false;
    }
    
    const now = Date.now();
    if (now >= config.breakEndTime) {
      // Break is over, resume automation
      console.log('✅ 6-hour break completed - resuming automation');
      updateConfig({
        isOn6HourBreak: false,
        breakStartTime: null,
        breakEndTime: null,
        active: true,
        status: '6-hour break completed - automation resumed',
        statusType: 'success'
      });
      return false;
    }
    
    // Still on break
    const remainingTime = config.breakEndTime - now;
    const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
    const remainingMinutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    console.log(`⏳ Still on 6-hour break - ${remainingHours}h ${remainingMinutes}m remaining`);
    return true;
  }
  
  // Find followers link/button
  function findFollowersButton() {
    // Look for "followers" text in various elements
    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      const text = link.textContent.toLowerCase();
      if (text.includes('follower') || text.includes('팔로워')) {
        return link;
      }
    }
    
    // Alternative: Look for specific span elements
    const spans = Array.from(document.querySelectorAll('span'));
    for (const span of spans) {
      const text = span.textContent.toLowerCase();
      if ((text.includes('follower') || text.includes('팔로워')) && span.querySelector('span[title]')) {
        // Click the parent link
        const link = span.closest('a');
        if (link) return link;
      }
    }
    
    return null;
  }
  
  // Find following link/button
  function findFollowingButton() {
    // Look for "following" text in various elements
    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      const text = link.textContent.toLowerCase();
      // Match "following" but not "followers"
      if ((text.includes('following') || text.includes('팔로잉')) && !text.includes('follower')) {
        return link;
      }
    }
    
    // Alternative: Look for specific span elements
    const spans = Array.from(document.querySelectorAll('span'));
    for (const span of spans) {
      const text = span.textContent.toLowerCase();
      if ((text.includes('following') || text.includes('팔로잉')) && !text.includes('follower')) {
        // Click the parent link
        const link = span.closest('a');
        if (link) return link;
      }
    }
    
    return null;
  }
  
  // Collect following usernames (similar to getFollowerUsernames but for following dialog)
  function getFollowingUsernames() {
    const usernames = new Set();
    
    // Look for username links in the following dialog
    const links = Array.from(document.querySelectorAll('a[href^="/"]'));
    for (const link of links) {
      const href = link.getAttribute('href');
      // Filter for username links (not post links, not hashtags, etc.)
      if (href && href.match(/^\/[a-zA-Z0-9._]+\/?$/) && !href.includes('/p/')) {
        const username = href.replace(/\//g, '');
        const span = link.querySelector('span');
        if (span && span.textContent === username) {
          usernames.add(username);
        }
      }
    }
    
    return Array.from(usernames);
  }
  
  // Scroll and collect all following accounts
  async function scrollAndCollectAllFollowing() {
    console.log('🚀 Starting to scroll and collect ALL following accounts...');
    isScrollingFollowers = true;
    
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('❌ Following dialog not found');
      isScrollingFollowers = false;
      return [];
    }
    
    console.log('✅ Found following dialog');
    
    // Find the actual scrollable following list container
    const scrollableDiv = findScrollableFollowersList(dialog);
    if (!scrollableDiv) {
      console.log('❌ Could not find scrollable following list');
      console.log('⚠️ Attempting to collect visible following only...');
      // Collect whatever following are visible
      const visibleFollowing = getFollowingUsernames();
      isScrollingFollowers = false;
      return visibleFollowing;
    }
    
    console.log(`📏 Initial - Client height: ${scrollableDiv.clientHeight}, Scroll height: ${scrollableDiv.scrollHeight}`);
    
    let allFollowing = new Set();
    let scrollAttempts = 0;
    let consecutiveNoChangeCount = 0;
    let lastScrollTop = -1;
    const maxConsecutiveNoChange = 3; // Stop after 3 consecutive scrolls with no new following
    const maxTotalAttempts = 1000;
    
    await updateConfig({
      status: 'Scrolling following list...',
      statusType: 'info'
    });
    
    while (consecutiveNoChangeCount < maxConsecutiveNoChange && scrollAttempts < maxTotalAttempts) {
      scrollAttempts++;
      
      const beforeScrollFollowing = getFollowingUsernames();
      beforeScrollFollowing.forEach(username => allFollowing.add(username));
      
      const beforeCount = allFollowing.size;
      console.log(`\n📊 Scroll attempt ${scrollAttempts}: ${beforeCount} following collected so far`);
      
      if (scrollAttempts % 5 === 0) {
        await updateConfig({
          status: `Scrolling following... collected ${beforeCount} accounts (attempt ${scrollAttempts})`,
          statusType: 'info'
        });
      }
      
      const beforeScrollTop = scrollableDiv.scrollTop;
      const beforeScrollHeight = scrollableDiv.scrollHeight;
      
      // Scroll to the absolute bottom
      const targetScroll = scrollableDiv.scrollHeight;
      scrollableDiv.scrollTop = targetScroll;
      
      try {
        scrollableDiv.scrollTo(0, targetScroll);
        scrollableDiv.scrollBy(0, 10000);
      } catch (e) {
        // Ignore errors
      }
      
      await randomDelay(1000, 1500);
      
      const afterScrollTop = scrollableDiv.scrollTop;
      
      if (lastScrollTop !== -1 && Math.abs(afterScrollTop - lastScrollTop) < 5) {
        console.log('⚠️ Scroll position hasn\'t changed from last attempt - might be at bottom');
      }
      lastScrollTop = afterScrollTop;
      
      console.log('⏳ Waiting for new content to load...');
      const loadingOccurred = await waitForLoadingComplete(8000);
      
      if (loadingOccurred) {
        console.log('✅ Loading spinner detected - new content loaded');
        await randomDelay(1500, 2000);
      } else {
        await randomDelay(1000, 1500);
      }
      
      const afterScrollFollowing = getFollowingUsernames();
      afterScrollFollowing.forEach(username => allFollowing.add(username));
      
      const afterCount = allFollowing.size;
      const newFollowing = afterCount - beforeCount;
      
      console.log(`📈 After loading: ${afterCount} total (➕ ${newFollowing} new this scroll)`);
      
      if (newFollowing === 0) {
        consecutiveNoChangeCount++;
        console.log(`🔴 No new following (${consecutiveNoChangeCount}/${maxConsecutiveNoChange} strikes)`);
        
        if (consecutiveNoChangeCount <= 3) {
          console.log(`🔄 No-change #${consecutiveNoChangeCount}, trying aggressive scroll...`);
          for (let i = 0; i < 5; i++) {
            scrollableDiv.scrollTop = scrollableDiv.scrollHeight + 10000;
            scrollableDiv.scrollBy(0, 5000);
            await randomDelay(400, 700);
          }
          await randomDelay(2000, 3000);
          
          const afterAggressiveFollowing = getFollowingUsernames();
          afterAggressiveFollowing.forEach(username => allFollowing.add(username));
          const afterAggressiveCount = allFollowing.size;
          const foundAfterAggressive = afterAggressiveCount - afterCount;
          
          if (foundAfterAggressive > 0) {
            console.log(`✅ Aggressive scroll found ${foundAfterAggressive} more following!`);
            consecutiveNoChangeCount = 0;
          }
        }
      } else {
        consecutiveNoChangeCount = 0;
        console.log(`✅ Found ${newFollowing} new following! Resetting counter, continuing...`);
      }
    }
    
    const finalList = Array.from(allFollowing);
    
    if (scrollAttempts >= maxTotalAttempts) {
      console.log(`⚠️ Reached maximum scroll attempts (${maxTotalAttempts})`);
    } else {
      console.log(`✅ Reached bottom after ${consecutiveNoChangeCount} consecutive no-change scrolls`);
    }
    
    console.log(`\n🎉 FINISHED! Total following collected: ${finalList.length}`);
    console.log(`📊 Total scroll attempts: ${scrollAttempts}`);
    
    await updateConfig({
      status: `✅ Collected ${finalList.length} following accounts (${scrollAttempts} scrolls)`,
      statusType: 'success'
    });
    
    isScrollingFollowers = false;
    return finalList;
  }
  
  // Get list of follower usernames from the dialog (excluding already followed/requested)
  function getFollowerUsernames() {
    const usernames = new Set();
    const skippedUsers = [];
    
    // Look for username links in the followers dialog
    const links = Array.from(document.querySelectorAll('a[href^="/"]'));
    for (const link of links) {
      const href = link.getAttribute('href');
      // Filter for username links (not post links, not hashtags, etc.)
      if (href && href.match(/^\/[a-zA-Z0-9._]+\/?$/) && !href.includes('/p/')) {
        const username = href.replace(/\//g, '');
        const span = link.querySelector('span');
        if (span && span.textContent === username) {
          // Check if this user is already being followed or requested
          // Look for status button near this username
          const parentContainer = link.closest('div[role="button"]')?.parentElement || link.parentElement.parentElement.parentElement;
          if (parentContainer) {
            const statusButton = parentContainer.querySelector('div._ap3a._aaco._aacw._aad6._aade');
            if (statusButton) {
              const statusText = statusButton.textContent.trim().toLowerCase();
              
              // Check for "Following" or "Requested" status
              if (statusText === 'following' || statusText === '팔로잉') {
                skippedUsers.push({ username, reason: 'FOLLOWING' });
                console.log(`⏭️ ALREADY FOLLOWING: @${username} - SKIPPING`);
                continue;
              } else if (statusText === 'requested' || statusText === '요청됨') {
                skippedUsers.push({ username, reason: 'REQUESTED' });
                console.log(`⏭️ ALREADY REQUESTED: @${username} - SKIPPING`);
                continue;
              }
            }
          }
          
          usernames.add(username);
        }
      }
    }
    
    // Summary log
    if (skippedUsers.length > 0) {
      const following = skippedUsers.filter(u => u.reason === 'FOLLOWING');
      const requested = skippedUsers.filter(u => u.reason === 'REQUESTED');
      
      console.log(`\n📊 SKIPPED USERS (${skippedUsers.length} total):`);
      if (following.length > 0) {
        console.log(`   ✅ FOLLOWING (${following.length}): ${following.map(u => u.username).join(', ')}`);
      }
      if (requested.length > 0) {
        console.log(`   ⏳ REQUESTED (${requested.length}): ${requested.map(u => u.username).join(', ')}`);
      }
      console.log('');
    }
    
    return Array.from(usernames);
  }
  
  // Check if loading spinner is visible
  function isLoadingSpinnerVisible() {
    // Look for the loading spinner/progressbar
    const loadingIndicators = document.querySelectorAll('[data-visualcompletion="loading-state"], [role="progressbar"], svg[aria-label="Loading..."]');
    
    for (const indicator of loadingIndicators) {
      // Check if the indicator is visible (not hidden)
      const rect = indicator.getBoundingClientRect();
      const style = window.getComputedStyle(indicator);
      
      if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
        return true;
      }
    }
    
    return false;
  }
  
  // Wait for loading spinner to appear and disappear
  async function waitForLoadingComplete(timeout = 10000) {
    const startTime = Date.now();
    let spinnerAppeared = false;
    
    // Wait for spinner to appear
    while (!isLoadingSpinnerVisible() && (Date.now() - startTime < timeout)) {
      await randomDelay(100, 200);
    }
    
    if (isLoadingSpinnerVisible()) {
      spinnerAppeared = true;
      console.log('Loading spinner appeared');
      
      // Now wait for it to disappear
      while (isLoadingSpinnerVisible() && (Date.now() - startTime < timeout)) {
        await randomDelay(100, 200);
      }
      
      console.log('Loading spinner disappeared');
    }
    
    return spinnerAppeared;
  }
  
  // Find the correct scrollable followers list container
  function findScrollableFollowersList(dialog) {
    // Try multiple selectors to find the actual scrollable list
    const selectors = [
      'div[style*="overflow-y"]',
      'div[style*="overflow: auto"]',
      'div[style*="overflow:auto"]',
      'div[style*="overflow: hidden auto"]',
      'div[style*="overflow:hidden auto"]'
    ];
    
    for (const selector of selectors) {
      const elements = dialog.querySelectorAll(selector);
      for (const element of elements) {
        // Check if this element is actually scrollable (has content taller than itself)
        if (element.scrollHeight > element.clientHeight + 10) {
          console.log(`✅ Found scrollable element with selector: ${selector}`);
          console.log(`   Client height: ${element.clientHeight}, Scroll height: ${element.scrollHeight}`);
          return element;
        }
      }
    }
    
    // Fallback: find any div with overflow that has followers in it
    const allDivs = dialog.querySelectorAll('div');
    for (const div of allDivs) {
      const style = window.getComputedStyle(div);
      const hasOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll';
      const isScrollable = div.scrollHeight > div.clientHeight + 10;
      
      if (hasOverflow && isScrollable) {
        console.log(`✅ Found scrollable element via computed style`);
        console.log(`   Client height: ${div.clientHeight}, Scroll height: ${div.scrollHeight}`);
        return div;
      }
    }
    
    return null;
  }
  
  // Scroll followers dialog to the bottom and collect all usernames
  async function scrollAndCollectAllFollowers() {
    console.log('🚀 Starting to scroll and collect ALL followers...');
    isScrollingFollowers = true;
    
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('❌ Followers dialog not found');
      isScrollingFollowers = false;
      return [];
    }
    
    console.log('✅ Found followers dialog');
    
    // Find the actual scrollable followers list container
    const scrollableDiv = findScrollableFollowersList(dialog);
    if (!scrollableDiv) {
      console.log('❌ Could not find scrollable followers list');
      console.log('⚠️ Attempting to collect visible followers only...');
      // Collect whatever followers are visible
      const visibleFollowers = getFollowerUsernames();
      isScrollingFollowers = false;
      return visibleFollowers;
    }
    
    console.log(`📏 Initial - Client height: ${scrollableDiv.clientHeight}, Scroll height: ${scrollableDiv.scrollHeight}`);
    
    let allFollowers = new Set();
    let scrollAttempts = 0;
    let consecutiveNoChangeCount = 0;
    let lastScrollTop = -1;
    const maxConsecutiveNoChange = 3; // Stop after 3 consecutive scrolls with no new followers
    const maxTotalAttempts = 1000; // Safety limit - max 1000 scroll attempts
    
    await updateConfig({
      status: 'Scrolling followers list...',
      statusType: 'info'
    });
    
    while (consecutiveNoChangeCount < maxConsecutiveNoChange && scrollAttempts < maxTotalAttempts) {
      scrollAttempts++;
      
      // Get current followers before scrolling
      const beforeScrollFollowers = getFollowerUsernames();
      beforeScrollFollowers.forEach(username => allFollowers.add(username));
      
      const beforeCount = allFollowers.size;
      console.log(`\n📊 Scroll attempt ${scrollAttempts}: ${beforeCount} followers collected so far`);
      
      // Update status every 5 scrolls
      if (scrollAttempts % 5 === 0) {
        await updateConfig({
          status: `Scrolling... collected ${beforeCount} followers (attempt ${scrollAttempts})`,
          statusType: 'info'
        });
      }
      
      // Get current scroll position
      const beforeScrollTop = scrollableDiv.scrollTop;
      const beforeScrollHeight = scrollableDiv.scrollHeight;
      
      console.log(`📍 Before scroll - Top: ${beforeScrollTop}, Height: ${beforeScrollHeight}`);
      
      // Scroll to the absolute bottom - use multiple methods to ensure it works
      const targetScroll = scrollableDiv.scrollHeight;
      
      // Method 1: Direct scrollTop
      scrollableDiv.scrollTop = targetScroll;
      
      // Method 2: scrollTo
      try {
        scrollableDiv.scrollTo(0, targetScroll);
      } catch (e) {
        // Ignore errors
      }
      
      // Method 3: scrollBy for good measure
      try {
        scrollableDiv.scrollBy(0, 10000);
      } catch (e) {
        // Ignore errors
      }
      
      // Wait for scroll animation
      await randomDelay(1000, 1500);
      
      const afterScrollTop = scrollableDiv.scrollTop;
      console.log(`📍 After scroll - Top: ${afterScrollTop}`);
      
      // Check if scroll position is actually changing between attempts
      if (lastScrollTop !== -1 && Math.abs(afterScrollTop - lastScrollTop) < 5) {
        console.log('⚠️ Scroll position hasn\'t changed from last attempt - might be at bottom');
      }
      lastScrollTop = afterScrollTop;
      
      // Check if we actually scrolled from before this scroll
      if (Math.abs(afterScrollTop - beforeScrollTop) < 10) {
        console.log('⚠️ Scroll position barely changed this attempt');
      }
      
      // Wait for loading spinner to appear and disappear
      console.log('⏳ Waiting for new content to load...');
      const loadingOccurred = await waitForLoadingComplete(8000);
      
      if (loadingOccurred) {
        console.log('✅ Loading spinner detected - new content loaded');
        await randomDelay(1500, 2000);
      } else {
        console.log('⚠️ No loading spinner detected - might be at end');
        await randomDelay(1000, 1500);
      }
      
      // Get followers after loading
      const afterScrollFollowers = getFollowerUsernames();
      afterScrollFollowers.forEach(username => allFollowers.add(username));
      
      const afterCount = allFollowers.size;
      const newFollowers = afterCount - beforeCount;
      
      console.log(`📈 After loading: ${afterCount} total (➕ ${newFollowers} new this scroll)`);
      
      // Check if we got new followers
      if (newFollowers === 0) {
        consecutiveNoChangeCount++;
        console.log(`🔴 No new followers (${consecutiveNoChangeCount}/${maxConsecutiveNoChange} strikes)`);
        
        // Try aggressive scrolls on first few no-changes
        if (consecutiveNoChangeCount <= 3) {
          console.log(`🔄 No-change #${consecutiveNoChangeCount}, trying aggressive scroll...`);
          for (let i = 0; i < 5; i++) {
            scrollableDiv.scrollTop = scrollableDiv.scrollHeight + 10000;
            scrollableDiv.scrollBy(0, 5000);
            await randomDelay(400, 700);
          }
          await randomDelay(2000, 3000);
          
          // Check one more time after aggressive scrolls
          const afterAggressiveFollowers = getFollowerUsernames();
          afterAggressiveFollowers.forEach(username => allFollowers.add(username));
          const afterAggressiveCount = allFollowers.size;
          const foundAfterAggressive = afterAggressiveCount - afterCount;
          
          if (foundAfterAggressive > 0) {
            console.log(`✅ Aggressive scroll found ${foundAfterAggressive} more followers!`);
            consecutiveNoChangeCount = 0; // Reset since we found more
          }
        }
      } else {
        consecutiveNoChangeCount = 0;
        console.log(`✅ Found ${newFollowers} new followers! Resetting counter, continuing...`);
      }
      
      // Check scroll height changes
      const newScrollHeight = scrollableDiv.scrollHeight;
      if (newScrollHeight > beforeScrollHeight) {
        console.log(`📏 Scroll height increased: ${beforeScrollHeight} → ${newScrollHeight}`);
      } else {
        console.log(`📏 Scroll height unchanged: ${beforeScrollHeight}`);
      }
    }
    
    const finalList = Array.from(allFollowers);
    
    if (scrollAttempts >= maxTotalAttempts) {
      console.log(`⚠️ Reached maximum scroll attempts (${maxTotalAttempts})`);
    } else {
      console.log(`✅ Reached bottom after ${consecutiveNoChangeCount} consecutive no-change scrolls`);
    }
    
    console.log(`\n🎉 FINISHED! Total followers collected: ${finalList.length}`);
    console.log(`📊 Total scroll attempts: ${scrollAttempts}`);
    
    await updateConfig({
      status: `✅ Collected ${finalList.length} followers (${scrollAttempts} scrolls)`,
      statusType: 'success'
    });
    
    isScrollingFollowers = false;
    return finalList;
  }
  
  // Check if bio contains abbreviation
  function checkBioForAbbreviation(bioText, abbreviations) {
    // If no abbreviations specified, match all users
    if (!abbreviations || abbreviations.length === 0) {
      console.log('✅ No abbreviations specified - matching all users');
      return true;
    }
    
    if (!bioText) {
      console.log('❌ No bio text to check');
      return false;
    }
    
    const lowerBio = bioText.toLowerCase();
    console.log(`🔍 Checking bio: "${bioText}"`);
    console.log(`🔍 Keywords to match: [${abbreviations.join(', ')}]`);
    
    for (const abbr of abbreviations) {
      if (!abbr || abbr.trim() === '') continue;
      
      const lowerAbbr = abbr.toLowerCase().trim();
      if (lowerBio.includes(lowerAbbr)) {
        console.log(`✅ MATCH FOUND! Bio contains keyword: "${abbr}"`);
        return true;
      }
    }
    
    console.log(`❌ NO MATCH - None of the keywords found in bio`);
    return false;
  }
  
  // Find and click follow button
  function findAndClickFollowButton() {
    // Look for Follow button (텍스트: "Follow", "팔로우", etc.)
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const button of buttons) {
      const text = button.textContent.toLowerCase().trim();
      if (text === 'follow' || text === '팔로우' || text === 'seguir') {
        // Make sure it's not "following" or "requested"
        if (!text.includes('following') && !text.includes('팔로잉') && !text.includes('requested')) {
          button.click();
          return true;
        }
      }
    }
    return false;
  }
  
  // Check if we're already following or requested
  function isAlreadyFollowing() {
    // Try to get username from URL
    const currentUrl = window.location.href;
    const usernameMatch = currentUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
    const username = usernameMatch ? usernameMatch[1] : 'unknown';
    
    // Check buttons for "Following", "Requested", or "Message"
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const button of buttons) {
      const text = button.textContent.toLowerCase().trim();
      
      // Check for Following status
      if (text.includes('following') || text.includes('팔로잉') || text.includes('message') || text.includes('메시지')) {
        console.log(`⏭️ ALREADY FOLLOWING: @${username} - SKIPPING PROFILE`);
        return true;
      }
      
      // Check for Requested status
      if (text.includes('requested') || text.includes('요청됨') || text.includes('pending')) {
        console.log(`⏭️ ALREADY REQUESTED: @${username} - SKIPPING PROFILE`);
        return true;
      }
    }
    
    // Also check for the specific div indicators
    const statusDivs = Array.from(document.querySelectorAll('div._ap3a._aaco._aacw._aad6._aade'));
    for (const div of statusDivs) {
      const text = div.textContent.trim().toLowerCase();
      
      // Check for Following
      if (text === 'following' || text === '팔로잉') {
        console.log(`⏭️ ALREADY FOLLOWING: @${username} - SKIPPING PROFILE`);
        return true;
      }
      
      // Check for Requested
      if (text === 'requested' || text === '요청됨' || text === 'pending') {
        console.log(`⏭️ ALREADY REQUESTED: @${username} - SKIPPING PROFILE`);
        return true;
      }
    }
    
    return false;
  }
  
  // Get bio text from profile
  function getBioText() {
    let bioText = '';
    
    // Method 1: Try the specific bio span selector
    const bioSpans = document.querySelectorAll('span._ap3a._aaco._aacu._aacx._aad7._aade');
    if (bioSpans.length > 0) {
      // Collect all bio spans (bio might be split across multiple spans)
      const bioTexts = Array.from(bioSpans).map(span => span.textContent.trim()).filter(t => t.length > 0);
      bioText = bioTexts.join(' ');
      console.log(`📝 Bio found (Method 1): "${bioText}"`);
    }
    
    // Method 2: If still empty, try broader selectors
    if (!bioText) {
      const altSelectors = [
        'div.-vDIg span',
        'div._aa_c span',
        'header section span'
      ];
      
      for (const selector of altSelectors) {
        const spans = Array.from(document.querySelectorAll(selector));
        for (const span of spans) {
          const text = span.textContent.trim();
          // Bio tends to be longer than just a name, but can be short too
          if (text && text.length > 0 && !text.startsWith('@')) {
            bioText = text;
            console.log(`📝 Bio found (Method 2 - ${selector}): "${bioText}"`);
            break;
          }
        }
        if (bioText) break;
      }
    }
    
    // Method 3: Get ALL text from profile header area
    if (!bioText) {
      const header = document.querySelector('header');
      if (header) {
        const allSpans = Array.from(header.querySelectorAll('span'));
        const possibleBio = allSpans
          .map(s => s.textContent.trim())
          .filter(t => t.length >= 2 && !t.startsWith('@') && !t.match(/^\d+$/))
          .join(' ');
        if (possibleBio) {
          bioText = possibleBio;
          console.log(`📝 Bio found (Method 3 - Header): "${bioText}"`);
        }
      }
    }
    
    if (!bioText) {
      console.log('⚠️ No bio text found on this profile');
    }
    
    return bioText;
  }
  
  // Main automation logic
  async function processAutomation() {
    console.log(`🔍 processAutomation called - isProcessing: ${isProcessing}, config.active: ${config?.active}, isScrollingFollowers: ${isScrollingFollowers}`);
    if (config) {
      console.log(`🔍 Mode: testMode=${config.testMode}, breakTestMode=${config.breakTestMode}, phase2TestMode=${config.phase2TestMode}, phase=${config.phase}`);
    }
    
    if (isProcessing || !config || isScrollingFollowers) {
      console.log(`⏭️ Skipping automation - isProcessing: ${isProcessing}, config.active: ${config?.active}, isScrollingFollowers: ${isScrollingFollowers}`);
      return;
    }
    
    // Check if we're on a 6-hour break
    if (isOn6HourBreak()) {
      return;
    }
    
    // Check if automation is active (after break check)
    if (!config.active) {
      console.log(`⏭️ Automation not active`);
      return;
    }
    
    // Check for "Try Again Later" error first (highest priority)
    if (checkForTryAgainLaterError()) {
      // Use 4-hour break instead of 6-hour for rate limiting
      await handle4HourBreakRateLimit();
      return;
    }
    
    // Check for "no followers" message in followers dialog
    if (checkForNoFollowersMessage()) {
      console.log('🚨 No followers message detected - account has no followers, taking 6-hour break');
      await handle6HourBreak();
      return;
    }
    
    // Check for daily limit popup (works for both Phase 1 and Phase 2)
    if (checkAndCloseDailyLimitPopup()) {
      // If daily limit popup was detected and closed, wait a bit before continuing
      console.log(`🔔 Daily limit popup detected and closed (Phase: ${config.phase || 'school'})`);
      await randomDelay(2000, 3000);
      return;
    }
    
    // Check hourly limit
    if (config.followsThisHour >= 5) {
      const timeUntilReset = config.hourResetTime - Date.now();
      if (timeUntilReset > 0) {
        const minutes = Math.ceil(timeUntilReset / 60000);
        await updateConfig({ 
          status: `Waiting ${minutes} minutes (hourly limit reached)`,
          statusType: 'info'
        });
        return;
      } else {
        // Reset hourly counter
        config.followsThisHour = 0;
        config.hourResetTime = Date.now() + 3600000;
        await updateConfig({ 
          followsThisHour: 0,
          hourResetTime: config.hourResetTime
        });
      }
    }
    
    isProcessing = true;
    
    try {
      const currentUrl = window.location.href;
      const currentAccount = config.instagramIds[config.currentAccountIndex];
      
      // Initialize followers list for current account if not exists
      if (!config.currentAccountFollowers) {
        config.currentAccountFollowers = [];
        config.followersCollected = false;
        config.currentFollowerIndex = 0;
      }
      
      // Break Test Mode: Follow anna_calbos then trigger 12-hour break
      if (config.breakTestMode) {
        console.log('⏰ BREAK TEST MODE: Testing 12-hour break functionality');
        console.log(`⏰ Current URL: ${currentUrl}`);
        console.log(`⏰ Break test profile: ${config.breakTestProfile}`);
        
        // Check if we're on the break test profile page
        const onBreakTestProfilePage = currentUrl.includes(`instagram.com/${config.breakTestProfile}`);
        
        if (onBreakTestProfilePage) {
          console.log(`⏰ BREAK TEST MODE: On @${config.breakTestProfile} profile page`);
          
          await randomDelay(2000, 3000);
          
          // Check if already following
          if (isAlreadyFollowing()) {
            console.log(`⏰ BREAK TEST MODE: Already following @${config.breakTestProfile}`);
          } else {
            // Follow the user
            console.log(`⏰ BREAK TEST MODE: Attempting to follow @${config.breakTestProfile}`);
            const followed = findAndClickFollowButton();
            
            if (followed) {
              console.log(`⏰ BREAK TEST MODE: Successfully followed @${config.breakTestProfile}`);
              config.totalFollows++;
              config.followsThisHour++;
              
              await updateConfig({
                totalFollows: config.totalFollows,
                followsThisHour: config.followsThisHour,
                status: `⏰ BREAK TEST MODE: Followed @${config.breakTestProfile}, triggering 12-hour break`,
                statusType: 'warning'
              });
              
              await randomDelay(3000, 5000);
            } else {
              console.log(`⏰ BREAK TEST MODE: Could not find follow button for @${config.breakTestProfile}`);
            }
          }
          
          // Now trigger the 6-hour break
          console.log(`⏰ BREAK TEST MODE: Triggering 6-hour break after following @${config.breakTestProfile}`);
          await handle6HourBreak();
          
          return;
        } else {
          // Navigate to the break test profile
          console.log(`⏰ BREAK TEST MODE: Navigating to @${config.breakTestProfile}`);
          
          const navigateResult = safeNavigate(`https://www.instagram.com/${config.breakTestProfile}/`);
          console.log(`⏰ BREAK TEST MODE: Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          
          if (navigateResult) {
            await updateConfig({
              status: `⏰ BREAK TEST MODE: Navigating to @${config.breakTestProfile}`,
              statusType: 'info'
            });
          }
          
          await randomDelay(2000, 3000);
        }
        
        isProcessing = false;
        return;
      }
      
      // Test Mode: Process specific test profiles
      if (config.testMode) {
        console.log('🧪 TEST MODE: Processing test profiles');
        console.log(`🧪 Current URL: ${currentUrl}`);
        console.log(`🧪 Test profiles: ${config.testProfiles?.join(', ')}`);
        console.log(`🧪 Current follower index: ${config.currentFollowerIndex}`);
        console.log(`🧪 Followers collected: ${config.followersCollected}`);
        
        // Initialize test profiles if not already done
        if (!config.currentAccountFollowers || config.currentAccountFollowers.length === 0) {
          console.log('🧪 Initializing test profiles...');
          config.currentAccountFollowers = config.testProfiles || [];
          config.followersCollected = true;
          config.currentFollowerIndex = 0;
          
          await updateConfig({
            currentAccountFollowers: config.currentAccountFollowers,
            followersCollected: true,
            currentFollowerIndex: 0,
            status: `🧪 TEST MODE: Ready to process ${config.currentAccountFollowers.length} test profiles`,
            statusType: 'success'
          });
          console.log('🧪 Test profiles initialized');
        }
        
        // Check if we're on a test profile page
        const currentTestProfile = config.currentAccountFollowers[config.currentFollowerIndex];
        const onTestProfilePage = currentUrl.includes(`instagram.com/${currentTestProfile}`);
        
        console.log(`🧪 Current test profile: ${currentTestProfile}`);
        console.log(`🧪 On test profile page: ${onTestProfilePage}`);
        console.log(`🧪 URL contains profile: ${currentUrl.includes(`instagram.com/${currentTestProfile}`)}`);
        
        if (onTestProfilePage) {
          console.log(`🧪 TEST MODE: Processing profile ${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length}: ${currentTestProfile}`);
          console.log(`🧪 TEST MODE: lastProfileVisitTime = ${lastProfileVisitTime}, current time = ${Date.now()}`);
          
          await randomDelay(2000, 3000);
          
          // Check if already following
          if (isAlreadyFollowing()) {
            console.log(`🧪 TEST MODE: Already following ${currentTestProfile}`);
          } else {
            // Get bio and check for school abbreviations (same logic as normal mode)
            console.log('\n🔎 TEST MODE: Checking bio for school keywords...');
            const bio = getBioText();
            console.log(`🧪 TEST MODE: Bio found: "${bio}"`);
            
            // Use the same abbreviation matching logic as normal mode
            const hasAbbreviation = checkBioForAbbreviation(bio, config.abbreviations);
            console.log(`🧪 TEST MODE: Keywords to match: [${config.abbreviations.join(', ')}]`);
            console.log(`🧪 TEST MODE: Match found: ${hasAbbreviation ? 'YES' : 'NO'}`);
            
            if (hasAbbreviation) {
              // Check rate limiting before following
              if (!canVisitProfile()) {
                console.log('🧪 TEST MODE: Rate limited, skipping follow');
                isProcessing = false;
                return;
              }
              
              const followed = findAndClickFollowButton();
              
              if (followed) {
                console.log(`🧪 TEST MODE: Followed ${currentTestProfile} (bio matched keywords)!`);
                lastProfileVisitTime = Date.now(); // Mark profile visit time after following
                config.totalFollows++;
                config.followsThisHour++;
                
                await updateConfig({
                  totalFollows: config.totalFollows,
                  followsThisHour: config.followsThisHour,
                  status: `🧪 TEST MODE: Followed ${config.totalFollows} profiles (${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length})`,
                  statusType: 'success'
                });
                
                await randomDelay(3000, 5000);
              }
            } else {
              console.log(`🧪 TEST MODE: Bio doesn't contain school keywords for ${currentTestProfile}, skipping follow`);
            }
          }
          
          // Check for break before navigation
          await checkForBreak();
          
          // Check if we've processed all test profiles
          if (config.currentFollowerIndex + 1 >= config.currentAccountFollowers.length) {
            console.log('🧪 TEST MODE: Finished processing all test profiles!');
            config.currentFollowerIndex++;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            await updateConfig({ 
              active: false,
              status: '🧪 TEST MODE: All test profiles processed!',
              statusType: 'success'
            });
            return;
          }
          
          // Navigate to next test profile
          const nextIndex = config.currentFollowerIndex + 1;
          const nextTestProfile = config.currentAccountFollowers[nextIndex];
          console.log(`🧪 TEST MODE: Moving to next profile: ${nextTestProfile}`);
          
          await updateConfig({
            status: `🧪 TEST MODE: Processing ${nextIndex + 1}/${config.currentAccountFollowers.length}`,
            statusType: 'info'
          });
          
          // Always wait 30 seconds before navigation
          console.log(`⏳ [Test Mode] Waiting 30 seconds before navigating to ${nextTestProfile}...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          console.log(`✅ [Test Mode] 30-second wait completed, navigating to ${nextTestProfile}`);
          
          // Navigate to next test profile
          console.log(`🧭 [Test Mode] Navigating to ${nextTestProfile}...`);
          const navigateResult = safeNavigate(`https://www.instagram.com/${nextTestProfile}/`);
          console.log(`🧭 [Test Mode] Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          if (navigateResult) {
            console.log(`🧭 [Test Mode] Navigation initiated to: https://www.instagram.com/${nextTestProfile}/`);
            // Only increment index and mark visit time after successful navigation
            lastProfileVisitTime = Date.now(); // Mark profile visit time after successful navigation
            config.currentFollowerIndex = nextIndex;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
          }
          await randomDelay(2000, 3000);
          
        } else {
          // Navigate to first test profile
          const firstTestProfile = config.currentAccountFollowers[config.currentFollowerIndex];
          console.log(`🧪 TEST MODE: Navigating to first test profile: ${firstTestProfile}`);
          
          // Always wait 30 seconds before navigation (except for first profile)
          if (lastProfileVisitTime > 0) {
            console.log(`⏳ [Test Mode] Waiting 30 seconds before navigating to ${firstTestProfile}...`);
            await new Promise(resolve => setTimeout(resolve, 30000));
            console.log(`✅ [Test Mode] 30-second wait completed, navigating to ${firstTestProfile}`);
          } else {
            console.log(`✅ [Test Mode] First profile, no wait needed for ${firstTestProfile}`);
          }
          const navigateResult = safeNavigate(`https://www.instagram.com/${firstTestProfile}/`);
          console.log(`🧭 [Test Mode] Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          if (navigateResult) {
            console.log(`🧭 [Test Mode] Navigation initiated to: https://www.instagram.com/${firstTestProfile}/`);
            // Mark visit time after successful navigation
            lastProfileVisitTime = Date.now();
          }
          await randomDelay(2000, 3000);
        }
        
        isProcessing = false;
        return;
      }
      
      // ============= PHASE 2 TEST MODE =============
      // Must come BEFORE school phase logic to prevent conflicts
      
      if (config.phase2TestMode) {
        console.log('🔄 PHASE 2 TEST MODE: Active');
        
        // Initialize with test following list if not already done
        if (!config.followingList || config.followingList.length === 0) {
          console.log('🔄 PHASE 2 TEST MODE: Initializing test following list');
          config.followingList = config.phase2TestFollowing || [];
          config.followingCollected = true;
          config.currentFollowingIndex = 0;
          config.processedFollowingAccounts = config.processedFollowingAccounts || [];
          
          await updateConfig({
            followingList: config.followingList,
            followingCollected: true,
            currentFollowingIndex: 0,
            phase: 'following_expansion', // Ensure we're in following expansion phase
            status: `🔄 PHASE 2 TEST MODE: Ready to process ${config.followingList.length} test following accounts`,
            statusType: 'success'
          });
        }
        
        // Get unprocessed following accounts
        const unprocessedFollowing = config.followingList.filter(
          username => !config.processedFollowingAccounts.includes(username)
        );
        
        console.log(`🔄 PHASE 2 TEST MODE: ${unprocessedFollowing.length} unprocessed, ${config.processedFollowingAccounts.length} processed`);
        
        // Check if all test following accounts are processed
        if (unprocessedFollowing.length === 0) {
          console.log('🔄 PHASE 2 TEST MODE: All test following accounts processed!');
          await updateConfig({ 
            active: false,
            status: '🔄 PHASE 2 TEST MODE: All test following accounts processed!',
            statusType: 'success'
          });
          isProcessing = false;
          return;
        }
        
        // Get current following account to process
        const currentFollowingAccount = unprocessedFollowing[0];
        console.log(`🔄 PHASE 2 TEST MODE: Processing @${currentFollowingAccount}`);
        
        // Check if we're on the following account's page
        if (currentUrl.includes(`instagram.com/${currentFollowingAccount}`) && !currentUrl.includes('/followers')) {
          console.log(`🔄 PHASE 2 TEST MODE: On @${currentFollowingAccount} page, clicking followers...`);
          await randomDelay(2000, 4000);
          
          const followersBtn = findFollowersButton();
          if (followersBtn) {
            console.log('Clicking followers button...');
            followersBtn.click();
            await randomDelay(3000, 5000);
          }
        }
        // On followers page - collect followers
        else if (currentUrl.includes(`/followers`) && !config.followersCollected) {
          console.log(`🔄 PHASE 2 TEST MODE: On followers page, collecting...`);
          
          const allFollowers = await scrollAndCollectAllFollowers();
          
          if (allFollowers.length === 0) {
            console.log(`🔄 PHASE 2 TEST MODE: No followers for @${currentFollowingAccount}, moving to next`);
            config.processedFollowingAccounts.push(currentFollowingAccount);
            await updateConfig({
              processedFollowingAccounts: config.processedFollowingAccounts,
              currentAccountFollowers: [],
              followersCollected: false,
              currentFollowerIndex: 0
            });
            
            isProcessing = false;
            return;
          }
          
          config.currentAccountFollowers = allFollowers;
          config.followersCollected = true;
          config.currentFollowerIndex = 0;
          
          await updateConfig({
            currentAccountFollowers: allFollowers,
            followersCollected: true,
            currentFollowerIndex: 0,
            status: `🔄 PHASE 2 TEST MODE: Processing 1 follower from @${currentFollowingAccount} (${allFollowers.length} total)`,
            statusType: 'success'
          });
          
          // Close dialog
          const dialog = document.querySelector('div[role="dialog"]');
          if (dialog) {
            const closeButton = dialog.querySelector('svg[aria-label="Close"], button[aria-label="Close"]');
            if (closeButton) {
              closeButton.click();
            }
          }
          
          await randomDelay(2000, 3000);
        }
        // Followers collected, visit followers (1 from first account, 2 from second)
        else if (config.followersCollected && config.currentAccountFollowers.length > 0) {
          // Determine how many followers to process based on which following account we're on
          const processedCount = config.processedFollowingAccounts.length;
          const maxFollowersForThisAccount = (processedCount === 0) ? 1 : 2; // 1 for first, 2 for second
          
          console.log(`🔄 PHASE 2 TEST MODE: Processing up to ${maxFollowersForThisAccount} followers from account ${processedCount + 1}`);
          
          // Check if we've processed enough followers for this account
          if (config.currentFollowerIndex >= maxFollowersForThisAccount) {
            console.log(`🔄 PHASE 2 TEST MODE: Processed ${config.currentFollowerIndex} followers from @${currentFollowingAccount}, moving to next`);
            
            // Mark as processed and move to next following account
            config.processedFollowingAccounts.push(currentFollowingAccount);
            await updateConfig({
              processedFollowingAccounts: config.processedFollowingAccounts,
              currentAccountFollowers: [],
              followersCollected: false,
              currentFollowerIndex: 0
            });
            
            // Get remaining unprocessed
            const remainingUnprocessed = config.followingList.filter(
              u => !config.processedFollowingAccounts.includes(u)
            );
            
            if (remainingUnprocessed.length > 0) {
              const nextFollowingAccount = remainingUnprocessed[0];
              console.log(`🔄 PHASE 2 TEST MODE: Moving to @${nextFollowingAccount} (${remainingUnprocessed.length} remaining)`);
              
              await updateConfig({
                status: `🔄 PHASE 2 TEST MODE: Processing @${nextFollowingAccount}`,
                statusType: 'info'
              });
              
              if (!safeNavigate(`https://www.instagram.com/${nextFollowingAccount}/`)) {
                isProcessing = false;
                return;
              }
              await randomDelay(3000, 5000);
            } else {
              console.log('🔄 PHASE 2 TEST MODE: All test following accounts processed!');
              await updateConfig({ 
                active: false,
                status: '🔄 PHASE 2 TEST MODE: Completed!',
                statusType: 'success'
              });
              isProcessing = false;
            }
            
            isProcessing = false;
            return;
          }
          
          // Continue processing followers
          const onProfilePage = currentUrl.match(/instagram\.com\/[a-zA-Z0-9._]+\/?$/) && 
                                !currentUrl.includes(currentFollowingAccount) &&
                                !currentUrl.includes('/followers');
          
          if (onProfilePage) {
            console.log(`🔄 PHASE 2 TEST MODE: On follower profile, checking bio...`);
            await randomDelay(2000, 3000);
            
            // Check if already following
            if (!isAlreadyFollowing()) {
              // Get bio and check
              const bio = getBioText();
              const hasAbbreviation = checkBioForAbbreviation(bio, config.abbreviations);
              
              if (hasAbbreviation) {
                const followed = findAndClickFollowButton();
                
                if (followed) {
                  console.log(`🔄 PHASE 2 TEST MODE: Followed user!`);
                  config.totalFollows++;
                  config.followsThisHour++;
                  
                  await updateConfig({
                    totalFollows: config.totalFollows,
                    followsThisHour: config.followsThisHour,
                    status: `🔄 PHASE 2 TEST MODE: Followed ${config.totalFollows} users`,
                    statusType: 'success'
                  });
                  
                  await randomDelay(3000, 5000);
                }
              }
            }
            
            // Increment follower index after processing
            config.currentFollowerIndex++;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            
            console.log(`🔄 PHASE 2 TEST MODE: Processed ${config.currentFollowerIndex}/${maxFollowersForThisAccount} followers from @${currentFollowingAccount}`);
            
            // Check if we've processed enough followers for this account
            if (config.currentFollowerIndex >= maxFollowersForThisAccount) {
              console.log(`🔄 PHASE 2 TEST MODE: Reached limit (${maxFollowersForThisAccount}), moving to next following account`);
              
              config.processedFollowingAccounts.push(currentFollowingAccount);
              await updateConfig({
                processedFollowingAccounts: config.processedFollowingAccounts,
                currentAccountFollowers: [],
                followersCollected: false,
                currentFollowerIndex: 0
              });
              
              // Get remaining unprocessed
              const remainingUnprocessed = config.followingList.filter(
                u => !config.processedFollowingAccounts.includes(u)
              );
              
              if (remainingUnprocessed.length > 0) {
                const nextFollowingAccount = remainingUnprocessed[0];
                console.log(`🔄 PHASE 2 TEST MODE: Moving to @${nextFollowingAccount} (${remainingUnprocessed.length} remaining)`);
                
                await updateConfig({
                  status: `🔄 PHASE 2 TEST MODE: Processing @${nextFollowingAccount}`,
                  statusType: 'info'
                });
                
                if (!safeNavigate(`https://www.instagram.com/${nextFollowingAccount}/`)) {
                  isProcessing = false;
                  return;
                }
                await randomDelay(3000, 5000);
              } else {
                console.log('🔄 PHASE 2 TEST MODE: All test following accounts processed!');
                await updateConfig({ 
                  active: false,
                  status: '🔄 PHASE 2 TEST MODE: All test following accounts processed!',
                  statusType: 'success'
                });
                isProcessing = false;
              }
              
              isProcessing = false;
              return;
            }
            
            // Not done yet, navigate to next follower
            const nextUsername = config.currentAccountFollowers[config.currentFollowerIndex];
            console.log(`🔄 PHASE 2 TEST MODE: Navigating to next follower ${config.currentFollowerIndex + 1}/${maxFollowersForThisAccount}: ${nextUsername}`);
            
            if (!safeNavigate(`https://www.instagram.com/${nextUsername}/`)) {
              isProcessing = false;
              return;
            }
            await randomDelay(2000, 3000);
            isProcessing = false;
            return;
          } else {
            // Navigate to first follower
            const firstUsername = config.currentAccountFollowers[config.currentFollowerIndex];
            console.log(`🔄 PHASE 2 TEST MODE: Navigating to follower ${config.currentFollowerIndex + 1}: ${firstUsername}`);
            
            if (!safeNavigate(`https://www.instagram.com/${firstUsername}/`)) {
              isProcessing = false;
              return;
            }
            await randomDelay(2000, 3000);
          }
        }
        // Navigate to first following account
        else if (!currentUrl.includes(currentFollowingAccount)) {
          console.log(`🔄 PHASE 2 TEST MODE: Navigating to @${currentFollowingAccount}`);
          if (!safeNavigate(`https://www.instagram.com/${currentFollowingAccount}/`)) {
            isProcessing = false;
            return;
          }
          await randomDelay(2000, 3000);
        }
        
        isProcessing = false;
        return;
      }
      
      // State 1: On account page, need to click followers
      if (currentUrl.includes(`instagram.com/${currentAccount}`) && !currentUrl.includes('/followers')) {
        await randomDelay(2000, 4000);
        
        const followersBtn = findFollowersButton();
        if (followersBtn) {
          console.log('Clicking followers button...');
          followersBtn.click();
          await randomDelay(3000, 5000);
        }
      }
      
      // State 2: On followers page - collect all followers first
      else if (currentUrl.includes('/followers') && !config.followersCollected) {
        console.log('On followers page, need to collect all followers...');
        
        // Scroll and collect all followers
        const allFollowers = await scrollAndCollectAllFollowers();
        
        if (allFollowers.length === 0) {
          console.log('No followers found, moving to next account');
          await moveToNextAccount();
          return;
        }
        
        // Store the collected followers
        config.currentAccountFollowers = allFollowers;
        config.followersCollected = true;
        config.currentFollowerIndex = 0;
        
        await updateConfig({
          currentAccountFollowers: allFollowers,
          followersCollected: true,
          currentFollowerIndex: 0,
          status: `Ready to process ${allFollowers.length} followers`,
          statusType: 'success'
        });
        
        // Close the dialog and start visiting profiles
        const dialog = document.querySelector('div[role="dialog"]');
        if (dialog) {
          // Try to close dialog by clicking outside or close button
          const closeButton = dialog.querySelector('svg[aria-label="Close"], button[aria-label="Close"]');
          if (closeButton) {
            closeButton.click();
          }
        }
        
        await randomDelay(2000, 3000);
      }
      
      // State 3: Followers collected, start visiting them
      else if (config.followersCollected && config.currentFollowerIndex < config.currentAccountFollowers.length) {
        // Check if we're on a profile page (not the main account or followers page)
        const currentAccount = config.instagramIds[config.currentAccountIndex];
        const onProfilePage = currentUrl.match(/instagram\.com\/[a-zA-Z0-9._]+\/?$/) && 
                              !currentUrl.includes(currentAccount) && 
                              !currentUrl.includes('/followers');
        
        if (onProfilePage) {
          // We're on a profile, check bio and follow
          console.log('On profile page, checking bio...');
          // Don't mark profile visit time here - only mark it after meaningful actions
          
          await randomDelay(2000, 3000);
          
          // Check if already following
          if (isAlreadyFollowing()) {
            console.log('Already following this user');
            
            // Check for break before navigation
            await checkForBreak();
            
            // Navigate to next profile
            if (config.currentFollowerIndex + 1 < config.currentAccountFollowers.length) {
              const nextIndex = config.currentFollowerIndex + 1;
              const nextUsername = config.currentAccountFollowers[nextIndex];
              console.log(`Moving to next profile: ${nextUsername} (${nextIndex + 1}/${config.currentAccountFollowers.length})`);
              
              // Always wait 30 seconds before navigation
              console.log(`⏳ Waiting 30 seconds before navigating to ${nextUsername}...`);
              await new Promise(resolve => setTimeout(resolve, 30000));
              console.log(`✅ 30-second wait completed, navigating to ${nextUsername}`);
              
              // Navigate to next profile
              console.log(`🧭 Navigating to ${nextUsername}...`);
              const navigateResult = safeNavigate(`https://www.instagram.com/${nextUsername}/`);
              console.log(`🧭 Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
              
              // Only increment index and mark visit time after successful navigation
              if (navigateResult) {
                lastProfileVisitTime = Date.now(); // Mark profile visit time after successful navigation
                config.currentFollowerIndex = nextIndex;
                await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
              }
            } else {
              // No more profiles to process
              config.currentFollowerIndex++;
              await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            }
            
            isProcessing = false;
            return;
          }
          
          // Get bio and check for abbreviations
          console.log('\n🔎 STARTING BIO CHECK...');
          const bio = getBioText();
          
          const hasAbbreviation = checkBioForAbbreviation(bio, config.abbreviations);
            
          if (hasAbbreviation) {
            // Check rate limiting before following
            if (!canVisitProfile()) {
              console.log('Rate limited, skipping follow');
              isProcessing = false;
              return;
            }
            
            // Follow the user
            const followed = findAndClickFollowButton();
            
            if (followed) {
              console.log('Followed user!');
              lastProfileVisitTime = Date.now(); // Mark profile visit time after following
              config.totalFollows++;
              config.followsThisHour++;
              
              // Reset no-follow counter after successful follow
              profilesCheckedWithoutFollow = 0;
              lastFollowTime = Date.now();
              
              await updateConfig({
                totalFollows: config.totalFollows,
                followsThisHour: config.followsThisHour,
                status: `Followed ${config.totalFollows} users (${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length} checked)`,
                statusType: 'success'
              });
              
              await randomDelay(3000, 5000);
            } else {
              // Didn't follow - increment counter
              profilesCheckedWithoutFollow++;
              console.log(`📊 No follow: ${profilesCheckedWithoutFollow}/50 profiles checked without match`);
            }
          } else {
            // No keyword match - increment counter
            profilesCheckedWithoutFollow++;
            console.log(`📊 No match: ${profilesCheckedWithoutFollow}/50 profiles checked without follow`);
            
            // Check if we need a 4-hour break
            if (profilesCheckedWithoutFollow >= 50) {
              console.log('🚨 50 profiles checked without any follows - triggering 4-hour break');
              await handle4HourBreakNoMatches();
              return;
            }
          }
          
          // Check for break before navigation
          await checkForBreak();
          
          // Check if we've processed all followers from this account
          if (config.currentFollowerIndex + 1 >= config.currentAccountFollowers.length) {
            console.log('Finished processing all followers for this account');
            config.currentFollowerIndex++;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            await moveToNextAccount();
            return;
          }
          
          // Navigate to next profile
          const nextIndex = config.currentFollowerIndex + 1;
          const nextUsername = config.currentAccountFollowers[nextIndex];
          console.log(`Moving to next profile: ${nextUsername} (${nextIndex + 1}/${config.currentAccountFollowers.length})`);
          
          await updateConfig({
            status: `Processing follower ${nextIndex + 1}/${config.currentAccountFollowers.length}`,
            statusType: 'info'
          });
          
          // Always wait 30 seconds before navigation
          console.log(`⏳ Waiting 30 seconds before navigating to ${nextUsername}...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          console.log(`✅ 30-second wait completed, navigating to ${nextUsername}`);
          
          // Navigate to next profile
          console.log(`🧭 Navigating to ${nextUsername}...`);
          const navigateResult = safeNavigate(`https://www.instagram.com/${nextUsername}/`);
          console.log(`🧭 Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          
          // Only increment index and mark visit time after successful navigation
          if (navigateResult) {
            lastProfileVisitTime = Date.now(); // Mark profile visit time after successful navigation
            config.currentFollowerIndex = nextIndex;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
          }
          await randomDelay(2000, 3000);
          
        } else if (currentUrl.includes(`instagram.com/${currentAccount}`)) {
          // We're back on the main account page, navigate to first follower
          const firstUsername = config.currentAccountFollowers[config.currentFollowerIndex];
          console.log(`On main account page, navigating to first follower: ${firstUsername}`);
          
          await updateConfig({
            status: `Starting to visit ${config.currentAccountFollowers.length} profiles`,
            statusType: 'info'
          });
          
          // Wait before navigation to respect rate limiting
          console.log(`🔍 Checking rate limit before navigating to first follower ${firstUsername}...`);
          if (!canVisitProfile()) {
            console.log(`❌ Rate limit active, skipping navigation to ${firstUsername}`);
            isProcessing = false;
            return;
          }
          
          console.log(`✅ Rate limit passed, navigating to first follower ${firstUsername}`);
          const navigateResult = safeNavigate(`https://www.instagram.com/${firstUsername}/`);
          console.log(`🧭 Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          if (!navigateResult) {
            return; // Navigation was blocked by anti-loop protection
          }
          await randomDelay(2000, 3000);
        } else {
          // We're somewhere unexpected, navigate to first follower
          const firstUsername = config.currentAccountFollowers[config.currentFollowerIndex];
          console.log(`Unexpected location, navigating to first follower: ${firstUsername}`);
          
          await updateConfig({
            status: `Navigating to follower ${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length}`,
            statusType: 'info'
          });
          
          // Wait before navigation to respect rate limiting
          console.log(`🔍 Checking rate limit before navigating to unexpected follower ${firstUsername}...`);
          if (!canVisitProfile()) {
            console.log(`❌ Rate limit active, skipping navigation to ${firstUsername}`);
            isProcessing = false;
            return;
          }
          
          console.log(`✅ Rate limit passed, navigating to unexpected follower ${firstUsername}`);
          const navigateResult = safeNavigate(`https://www.instagram.com/${firstUsername}/`);
          console.log(`🧭 Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
          if (!navigateResult) {
            return; // Navigation was blocked by anti-loop protection
          }
          await randomDelay(2000, 3000);
        }
      }
      
      // State 4: All followers processed for this account
      else if (config.followersCollected && config.currentFollowerIndex >= config.currentAccountFollowers.length) {
        console.log('All followers processed for this account');
        await moveToNextAccount();
        return;
      }
      
      // ============= FOLLOWING EXPANSION PHASE =============
      // Process accounts from own following list
      
      if (config.phase === 'following_expansion') {
        console.log('📢 Following Expansion Phase active');
        
        // State 1: On own profile, need to click following
        if (currentUrl.includes(`instagram.com/${config.ownUsername}`) && !currentUrl.includes('/following')) {
          await randomDelay(2000, 4000);
          
          const followingBtn = findFollowingButton();
          if (followingBtn) {
            console.log('Clicking following button...');
            followingBtn.click();
            await randomDelay(3000, 5000);
          } else {
            console.log('⚠️ Following button not found');
          }
        }
        
        // State 2: On following page - collect all following accounts
        else if (currentUrl.includes('/following') && !config.followingCollected) {
          console.log('On following page, collecting all following accounts...');
          
          const allFollowing = await scrollAndCollectAllFollowing();
          
          if (allFollowing.length === 0) {
            console.log('No following found, stopping bot');
            await updateConfig({ 
              active: false,
              status: 'No following accounts found',
              statusType: 'error'
            });
            return;
          }
          
          // Filter out already processed accounts
          const unprocessedFollowing = allFollowing.filter(
            username => !config.processedFollowingAccounts.includes(username)
          );
          
          console.log(`📊 Total following: ${allFollowing.length}, Unprocessed: ${unprocessedFollowing.length}`);
          
          // Only check for completion if we're collecting following for the first time
          // Don't stop if we're refreshing after processing a batch
          if (unprocessedFollowing.length === 0 && config.processedFollowingAccounts.length === 0) {
            console.log('✅ No following accounts found at all!');
            await updateConfig({ 
              active: false,
              status: 'No following accounts to process',
              statusType: 'error'
            });
            return;
          }
          
          // If all processed but we have some, just refresh the list
          if (unprocessedFollowing.length === 0 && config.processedFollowingAccounts.length > 0) {
            console.log('🔄 All current following processed, refreshing list to find new accounts...');
            await updateConfig({ 
              followingCollected: false,
              currentFollowingIndex: 0,
              status: 'Refreshing following list for new accounts...',
              statusType: 'info'
            });
            
            // Navigate to own profile to refresh
            await randomDelay(2000, 3000);
            if (!safeNavigate(`https://www.instagram.com/${config.ownUsername}/`)) {
              return;
            }
            return;
          }
          
          config.followingList = unprocessedFollowing;
          config.followingCollected = true;
          config.currentFollowingIndex = 0;
          
          await updateConfig({
            followingList: unprocessedFollowing,
            followingCollected: true,
            currentFollowingIndex: 0,
            status: `Ready to process ${unprocessedFollowing.length} following accounts`,
            statusType: 'success'
          });
          
          // Close the dialog
          const dialog = document.querySelector('div[role="dialog"]');
          if (dialog) {
            const closeButton = dialog.querySelector('svg[aria-label="Close"], button[aria-label="Close"]');
            if (closeButton) {
              closeButton.click();
            }
          }
          
          await randomDelay(2000, 3000);
        }
        
        // State 3: Following collected, navigate to first following account
        else if (config.followingCollected && !config.followersCollected) {
          // Get current unprocessed following account (use filtered array, not index)
          const unprocessedFollowing = config.followingList.filter(
            username => !config.processedFollowingAccounts.includes(username)
          );
          
          console.log(`📊 [Following Expansion] State 3 - Unprocessed: ${unprocessedFollowing.length}, Processed: ${config.processedFollowingAccounts.length}`);
          
          if (unprocessedFollowing.length === 0) {
            console.log('✅ All following accounts processed, refreshing list...');
            await updateConfig({ 
              followingCollected: false,
              currentFollowingIndex: 0,
              status: 'Refreshing following list...',
              statusType: 'info'
            });
            
            if (!safeNavigate(`https://www.instagram.com/${config.ownUsername}/`)) {
              isProcessing = false;
              return;
            }
            await randomDelay(2000, 3000);
            isProcessing = false;
            return;
          }
          
          const currentFollowingAccount = unprocessedFollowing[0]; // Always use first unprocessed
          console.log(`📊 [Following Expansion] Current following account: @${currentFollowingAccount}`);
          
          // Check if we're on the following account's page
          if (currentUrl.includes(`instagram.com/${currentFollowingAccount}`) && !currentUrl.includes('/followers')) {
            console.log(`On following account page: ${currentFollowingAccount}, clicking followers...`);
            await randomDelay(2000, 4000);
            
            const followersBtn = findFollowersButton();
            if (followersBtn) {
              console.log('Clicking followers button...');
              followersBtn.click();
              await randomDelay(3000, 5000);
            }
          } else if (!currentUrl.includes(`instagram.com/${currentFollowingAccount}`)) {
            // Navigate to the following account
            console.log(`Navigating to following account: ${currentFollowingAccount}`);
            if (!safeNavigate(`https://www.instagram.com/${currentFollowingAccount}/`)) {
              return;
            }
            await randomDelay(2000, 3000);
          }
        }
        
        // State 4: On followers page of a following account - collect followers
        else if (config.followingCollected && currentUrl.includes('/followers') && !config.followersCollected) {
          console.log('On followers page of following account, collecting followers...');
          
          // Get current following account from unprocessed list
          const unprocessedFollowing = config.followingList.filter(
            username => !config.processedFollowingAccounts.includes(username)
          );
          const currentFollowingAccount = unprocessedFollowing[0];
          
          console.log(`📊 [Following Expansion] Collecting followers from @${currentFollowingAccount}`);
          
          const allFollowers = await scrollAndCollectAllFollowers();
          
          if (allFollowers.length === 0) {
            console.log(`No followers found for @${currentFollowingAccount}, moving to next`);
            
            // Mark this following account as processed
            config.processedFollowingAccounts.push(currentFollowingAccount);
            await updateConfig({
              processedFollowingAccounts: config.processedFollowingAccounts
            });
            
            await moveToNextFollowingAccount();
            return;
          }
          
          config.currentAccountFollowers = allFollowers;
          config.followersCollected = true;
          config.currentFollowerIndex = 0;
          
          await updateConfig({
            currentAccountFollowers: allFollowers,
            followersCollected: true,
            currentFollowerIndex: 0,
            status: `Ready to process ${allFollowers.length} followers from following account`,
            statusType: 'success'
          });
          
          // Close the dialog
          const dialog = document.querySelector('div[role="dialog"]');
          if (dialog) {
            const closeButton = dialog.querySelector('svg[aria-label="Close"], button[aria-label="Close"]');
            if (closeButton) {
              closeButton.click();
            }
          }
          
          await randomDelay(2000, 3000);
        }
        
        // State 5: Followers collected, visit each one
        else if (config.followersCollected && config.currentFollowerIndex < config.currentAccountFollowers.length) {
          // Get current unprocessed following account (use filtered array, not index)
          const unprocessedFollowing = config.followingList.filter(
            username => !config.processedFollowingAccounts.includes(username)
          );
          
          console.log(`📊 [Following Expansion] State 5 - Unprocessed: ${unprocessedFollowing.length}, Processing follower ${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length}`);
          
          if (unprocessedFollowing.length === 0) {
            console.log('⚠️ [Following Expansion] No unprocessed following accounts, but still have followers to process. Refreshing...');
            await updateConfig({ 
              followingCollected: false,
              currentFollowingIndex: 0,
              currentAccountFollowers: [],
              followersCollected: false,
              currentFollowerIndex: 0
            });
            isProcessing = false;
            return;
          }
          
          const currentFollowingAccount = unprocessedFollowing[0]; // Always use first unprocessed
          console.log(`📊 [Following Expansion] Current following account: @${currentFollowingAccount}`);
          const onProfilePage = currentUrl.match(/instagram\.com\/[a-zA-Z0-9._]+\/?$/) && 
                                !currentUrl.includes(currentFollowingAccount) &&
                                !currentUrl.includes(config.ownUsername) &&
                                !currentUrl.includes('/followers');
          
          if (onProfilePage) {
            // We're on a follower's profile, check bio and follow
            console.log('On follower profile page, checking bio...');
            await randomDelay(2000, 3000);
            
            // Check if already following
            if (isAlreadyFollowing()) {
              console.log('Already following this user');
              
              config.currentFollowerIndex++;
              await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
              
              // Navigate to next profile or move to next following account
              if (config.currentFollowerIndex < config.currentAccountFollowers.length) {
                const nextUsername = config.currentAccountFollowers[config.currentFollowerIndex];
                console.log(`Moving to next follower: ${nextUsername}`);
                
                // Check for break before navigation
                await checkForBreak();
                
                // Wait before navigation to respect rate limiting
                console.log(`🔍 [Following Expansion] Checking rate limit before navigating to ${nextUsername}...`);
                if (!canVisitProfile()) {
                  console.log(`❌ [Following Expansion] Rate limit active, skipping navigation to ${nextUsername}`);
                  isProcessing = false;
                  return;
                }
                
                console.log(`✅ [Following Expansion] Rate limit passed, navigating to ${nextUsername}`);
                lastProfileVisitTime = Date.now(); // Mark visit time before navigation
                const navigateResult = safeNavigate(`https://www.instagram.com/${nextUsername}/`);
                console.log(`🧭 [Following Expansion] Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
              } else {
                // Mark this following account as processed
                config.processedFollowingAccounts.push(currentFollowingAccount);
                await updateConfig({
                  processedFollowingAccounts: config.processedFollowingAccounts
                });
                await moveToNextFollowingAccount();
              }
              
              isProcessing = false;
              return;
            }
            
            // Get bio and check for abbreviations
            console.log('\n🔎 STARTING BIO CHECK...');
            const bio = getBioText();
            const hasAbbreviation = checkBioForAbbreviation(bio, config.abbreviations);
            
            if (hasAbbreviation) {
              const followed = findAndClickFollowButton();
              
              if (followed) {
                console.log('Followed user!');
                config.totalFollows++;
                config.followsThisHour++;
                
                // Reset no-follow counter after successful follow
                profilesCheckedWithoutFollow = 0;
                lastFollowTime = Date.now();
                
                await updateConfig({
                  totalFollows: config.totalFollows,
                  followsThisHour: config.followsThisHour,
                  status: `Followed ${config.totalFollows} users (Following Expansion: ${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length})`,
                  statusType: 'success'
                });
                
                await randomDelay(3000, 5000);
              } else {
                // Didn't follow - increment counter
                profilesCheckedWithoutFollow++;
                console.log(`📊 [Following Expansion] No follow: ${profilesCheckedWithoutFollow}/50 profiles checked without match`);
              }
            } else {
              // No keyword match - increment counter
              profilesCheckedWithoutFollow++;
              console.log(`📊 [Following Expansion] No match: ${profilesCheckedWithoutFollow}/50 profiles checked without follow`);
              
              // Check if we need a 4-hour break
              if (profilesCheckedWithoutFollow >= 50) {
                console.log('🚨 [Following Expansion] 50 profiles checked without any follows - triggering 4-hour break');
                await handle4HourBreakNoMatches();
                return;
              }
            }
            
            // Move to next follower
            config.currentFollowerIndex++;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            
            // Check if we've processed all followers from this following account
            if (config.currentFollowerIndex >= config.currentAccountFollowers.length) {
              console.log('Finished processing all followers for this following account');
              
              // Mark this following account as processed
              config.processedFollowingAccounts.push(currentFollowingAccount);
              await updateConfig({
                processedFollowingAccounts: config.processedFollowingAccounts
              });
              
              await moveToNextFollowingAccount();
              return;
            }
            
            // Navigate to next profile
            const nextUsername = config.currentAccountFollowers[config.currentFollowerIndex];
            console.log(`Moving to next follower profile: ${nextUsername}`);
            
            // Check for break before navigation
            await checkForBreak();
            
            // Wait before navigation to respect rate limiting
            console.log(`🔍 [Following Expansion] Checking rate limit before navigating to ${nextUsername}...`);
            if (!canVisitProfile()) {
              console.log(`❌ [Following Expansion] Rate limit active, skipping navigation to ${nextUsername}`);
              isProcessing = false;
              return;
            }
            
            console.log(`✅ [Following Expansion] Rate limit passed, navigating to ${nextUsername}`);
            lastProfileVisitTime = Date.now(); // Mark visit time before navigation
            const navigateResult = safeNavigate(`https://www.instagram.com/${nextUsername}/`);
            console.log(`🧭 [Following Expansion] Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
            await randomDelay(2000, 3000);
            
          } else {
            // Navigate to first follower
            const firstUsername = config.currentAccountFollowers[config.currentFollowerIndex];
            console.log(`Navigating to follower: ${firstUsername}`);
            
            // Wait before navigation to respect rate limiting
            console.log(`🔍 [Following Expansion] Checking rate limit before navigating to first follower ${firstUsername}...`);
            if (!canVisitProfile()) {
              console.log(`❌ [Following Expansion] Rate limit active, skipping navigation to ${firstUsername}`);
              isProcessing = false;
              return;
            }
            
            console.log(`✅ [Following Expansion] Rate limit passed, navigating to first follower ${firstUsername}`);
            lastProfileVisitTime = Date.now(); // Mark visit time before navigation
            const navigateResult = safeNavigate(`https://www.instagram.com/${firstUsername}/`);
            console.log(`🧭 [Following Expansion] Navigation result: ${navigateResult ? 'SUCCESS' : 'FAILED'}`);
            if (!navigateResult) {
              return;
            }
            await randomDelay(2000, 3000);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in automation:', error);
    }
    
    isProcessing = false;
  }
  
  // Move to next Instagram account (or transition to following expansion phase)
  async function moveToNextAccount() {
    console.log('Moving to next account...');
    console.log(`📊 Current account: ${config.currentAccountIndex + 1}/${config.instagramIds?.length || 0}, Phase: ${config.phase}`);
    
    config.currentAccountIndex++;
    config.currentAccountFollowers = [];
    config.followersCollected = false;
    config.currentFollowerIndex = 0;
    
    console.log(`📊 Moving to account: ${config.currentAccountIndex + 1}/${config.instagramIds?.length || 0}`);
    
    if (config.currentAccountIndex >= config.instagramIds.length) {
      // All school accounts processed
      
      if (config.enableFollowingExpansion && config.phase === 'school') {
        // Transition to following expansion phase
        console.log('🎉 School accounts completed! Starting Following Expansion Phase...');
        
        await updateConfig({ 
          phase: 'following_expansion',
          followingList: [],
          followingCollected: false,
          currentFollowingIndex: 0,
          currentAccountFollowers: [],
          followersCollected: false,
          currentFollowerIndex: 0,
          status: 'Phase 1 complete! Starting to process your following...',
          statusType: 'success'
        });
        
        // Navigate to own profile
        await randomDelay(2000, 3000);
        if (!safeNavigate(`https://www.instagram.com/${config.ownUsername}/`)) {
          return;
        }
        
        return;
      } else {
        // All done
        await updateConfig({ 
          active: false,
          status: 'Completed! All accounts processed.',
          statusType: 'success'
        });
        isProcessing = false; // Reset processing flag
        return;
      }
    }
    
    await updateConfig({
      currentAccountIndex: config.currentAccountIndex,
      currentAccountFollowers: [],
      followersCollected: false,
      currentFollowerIndex: 0,
      status: `Moving to account ${config.currentAccountIndex + 1}/${config.instagramIds.length}`,
      statusType: 'info'
    });
    
    const nextAccount = config.instagramIds[config.currentAccountIndex];
    if (!safeNavigate(`https://www.instagram.com/${nextAccount}/`)) {
      return; // Navigation was blocked by anti-loop protection
    }
    await randomDelay(3000, 5000);
  }
  
  // Move to next following account in expansion phase
  async function moveToNextFollowingAccount() {
    console.log('Moving to next following account...');
    
    // Reset followers data for next account
    config.currentAccountFollowers = [];
    config.followersCollected = false;
    config.currentFollowerIndex = 0;
    
    // Filter out already processed following accounts from the ORIGINAL list
    let unprocessedFollowing = config.followingList.filter(
      username => !config.processedFollowingAccounts.includes(username)
    );
    
    console.log(`📊 Total following: ${config.followingList.length}, Processed: ${config.processedFollowingAccounts.length}, Remaining: ${unprocessedFollowing.length}`);
    
    // Check if there are any unprocessed following accounts left
    if (unprocessedFollowing.length === 0) {
      // All following accounts in this batch processed
      console.log('🎉 Batch complete! Refreshing following list to check for new accounts...');
      
      await updateConfig({ 
        followingCollected: false,
        currentFollowingIndex: 0,
        status: 'Refreshing following list for new accounts...',
        statusType: 'info'
      });
      
      // Navigate to own profile to refresh following list
      await randomDelay(2000, 3000);
      if (!safeNavigate(`https://www.instagram.com/${config.ownUsername}/`)) {
        return;
      }
      
      return;
    }
    
    // Get the FIRST unprocessed account (index 0 of filtered array)
    const nextAccount = unprocessedFollowing[0];
    console.log(`📊 Next unprocessed account: ${nextAccount} (1/${unprocessedFollowing.length} remaining)`);
    
    await updateConfig({
      currentFollowingIndex: 0, // Reset to 0 since we're using filtered array
      currentAccountFollowers: [],
      followersCollected: false,
      currentFollowerIndex: 0,
      status: `Processing following account: ${nextAccount} (${unprocessedFollowing.length} remaining)`,
      statusType: 'info'
    });
    
    if (!safeNavigate(`https://www.instagram.com/${nextAccount}/`)) {
      return; // Navigation was blocked by anti-loop protection
    }
    await randomDelay(3000, 5000);
  }
  
  // Update config in storage
  async function updateConfig(updates) {
    config = { ...config, ...updates };
    await chrome.runtime.sendMessage({ 
      action: 'updateConfig', 
      updates: updates 
    });
  }
  
  // Initialize
  async function init() {
    // Get config from storage
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    config = response.config;
    
    if (!config || !config.active) {
      return;
    }
    
    // Reset rate limiting counters
    lastProfileVisitTime = 0;
    processedAccountsCount = 0;
    
    if (config.testMode) {
      console.log('🧪 TEST MODE INITIALIZED');
      console.log(`🧪 Test profiles: ${config.testProfiles ? config.testProfiles.join(', ') : 'None'}`);
      console.log(`🧪 School keywords: [${config.abbreviations.join(', ')}]`);
      console.log('⏱️ Rate limiting: 30 seconds between profile visits, 1-minute break every 5 accounts');
      console.log('🧪 Note: Test mode uses the same school keyword matching as normal mode');
    } else if (config.breakTestMode) {
      console.log('⏰ BREAK TEST MODE INITIALIZED');
      console.log(`⏰ Break test profile: @${config.breakTestProfile}`);
      console.log('⏰ This mode will:');
      console.log('   1. Navigate to @anna_calbos profile');
      console.log('   2. Follow the profile');
      console.log('   3. Trigger 6-hour break automatically');
      console.log('⏰ Perfect for testing the break functionality!');
    } else if (config.phase2TestMode) {
      console.log('🔄 PHASE 2 TEST MODE INITIALIZED');
      console.log(`🔄 Test following accounts: ${config.phase2TestFollowing ? config.phase2TestFollowing.join(', ') : 'None'}`);
      console.log(`🔄 School keywords: [${config.abbreviations.join(', ')}]`);
      console.log('🔄 This mode will:');
      console.log('   1. Visit @jonathankolon1 → collect followers → process 1 follower');
      console.log('   2. Visit @julianne.t.2028 → collect followers → process 2 followers');
      console.log('   3. Complete when both accounts done');
      console.log('🔄 Fast testing: Total 3 followers processed!');
    } else {
      console.log('🤖 Instagram automation initialized with TWO-PHASE workflow');
      console.log('📋 PHASE 1 (School): Collect ALL followers → Visit each profile → Move to next account');
      console.log('⏱️ Rate limiting: 30 seconds between profile visits, 1-minute break every 5 accounts');
      if (config.enableFollowingExpansion) {
        console.log('📋 PHASE 2 (Following Expansion): Go to own profile → Get following list → For each following account, process their followers');
        console.log('♻️ Phase 2 repeats continuously, refreshing following list to find new accounts');
      }
    }
    console.log(`👤 Own profile: @${config.ownUsername}`);
    
    // Start processing loop
    setInterval(processAutomation, 8000);
  }
  
  // Test function to manually trigger 6-hour break with custom duration (for testing purposes)
  window.test6HourBreak = function(testDurationMinutes = 2) {
    console.log(`🧪 TESTING: Manually triggering 6-hour break with ${testDurationMinutes} minute duration`);
    
    const breakEndTime = Date.now() + (testDurationMinutes * 60 * 1000);
    const breakEndDate = new Date(breakEndTime);
    
    console.log(`⏰ Test break will end at: ${breakEndDate.toLocaleString()}`);
    
    // Store break information in config
    updateConfig({
      active: false,
      isOn6HourBreak: true,
      breakStartTime: Date.now(),
      breakEndTime: breakEndTime,
      status: `🧪 TEST: ${testDurationMinutes}-minute break started. Resuming at ${breakEndDate.toLocaleString()}`,
      statusType: 'warning'
    });
    
    // Set up a one-time alarm to resume after test duration
    chrome.runtime.sendMessage({
      action: 'setBreakAlarm',
      breakEndTime: breakEndTime
    });
    
    console.log(`✅ Test break initiated - will resume in ${testDurationMinutes} minutes`);
    return true;
  };
  
  // Test function to simulate "Try Again Later" error (for testing purposes)
  window.testTryAgainLaterError = function() {
    console.log('🧪 TESTING: Simulating "Try Again Later" error detection');
    
    // Create a mock error element with the exact CSS classes
    const mockError = document.createElement('h3');
    mockError.className = 'x1lliihq x1plvlek xryxfnj x1n2onr6 xyejjpt x15dsfln x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye x1ms8i2q xo1l8bm x5n08af x4zkp8e xw06pyt x10wh9bi xpm28yp x8viiok x1o7cslx';
    mockError.setAttribute('dir', 'auto');
    mockError.setAttribute('tabindex', '-1');
    mockError.textContent = 'Try Again Later';
    
    const mockDescription = document.createElement('span');
    mockDescription.className = 'x1lliihq x1plvlek xryxfnj x1n2onr6 xyejjpt x15dsfln x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xvs91rp xo1l8bm x1roi4f4 x1tu3fi x3x7a5m x10wh9bi xpm28yp x8viiok x1o7cslx';
    mockDescription.setAttribute('dir', 'auto');
    mockDescription.textContent = 'We limit how often you can do certain things on Instagram, like following people, to protect our community. Let us know if you think we made a mistake.';
    
    // Add to page temporarily
    const container = document.createElement('div');
    container.appendChild(mockError);
    container.appendChild(mockDescription);
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.zIndex = '9999';
    container.style.background = 'white';
    container.style.padding = '10px';
    container.style.border = '2px solid red';
    document.body.appendChild(container);
    
    console.log('🧪 Mock error elements added to page');
    console.log('🧪 Testing error detection...');
    
    // Test the detection function
    const detected = checkForTryAgainLaterError();
    console.log(`🧪 Error detection result: ${detected ? 'DETECTED' : 'NOT DETECTED'}`);
    
    // Clean up after 5 seconds
    setTimeout(() => {
      document.body.removeChild(container);
      console.log('🧪 Test cleanup completed');
    }, 5000);
    
    return detected;
  };
  
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
