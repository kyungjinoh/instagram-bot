// Content script that runs on Instagram pages
(function() {
  'use strict';
  
  let config = null;
  let isProcessing = false;
  let isScrollingFollowers = false;
  let lastNavigationTime = 0;
  let navigationCount = 0;
  
  // Utility: Wait for a random time to appear more human-like
  function randomDelay(min = 2000, max = 5000) {
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * (max - min) + min);
    });
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
    const maxConsecutiveNoChange = 8; // Must have no new followers 8 times in a row
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
    if (isProcessing || !config || !config.active || isScrollingFollowers) {
      return;
    }
    
    // Check for daily limit popup first
    if (checkAndCloseDailyLimitPopup()) {
      // If daily limit popup was detected and closed, wait a bit before continuing
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
          await randomDelay(2000, 3000);
          
          // Check if already following
          if (isAlreadyFollowing()) {
            console.log('Already following this user');
            
            // Move to next follower
            config.currentFollowerIndex++;
            await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
            
            // Navigate to next profile
            if (config.currentFollowerIndex < config.currentAccountFollowers.length) {
              const nextUsername = config.currentAccountFollowers[config.currentFollowerIndex];
              console.log(`Moving to next profile: ${nextUsername} (${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length})`);
              safeNavigate(`https://www.instagram.com/${nextUsername}/`);
            }
            
            isProcessing = false;
            return;
          }
          
          // Get bio and check for abbreviations
          console.log('\n🔎 STARTING BIO CHECK...');
          const bio = getBioText();
          
          const hasAbbreviation = checkBioForAbbreviation(bio, config.abbreviations);
            
          if (hasAbbreviation) {
            // Follow the user
            const followed = findAndClickFollowButton();
            
            if (followed) {
              console.log('Followed user!');
              config.totalFollows++;
              config.followsThisHour++;
              
              await updateConfig({
                totalFollows: config.totalFollows,
                followsThisHour: config.followsThisHour,
                status: `Followed ${config.totalFollows} users (${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length} checked)`,
                statusType: 'success'
              });
              
              await randomDelay(3000, 5000);
            }
          }
          
          // Move to next follower
          config.currentFollowerIndex++;
          await updateConfig({ currentFollowerIndex: config.currentFollowerIndex });
          
          // Check if we've processed all followers from this account
          if (config.currentFollowerIndex >= config.currentAccountFollowers.length) {
            console.log('Finished processing all followers for this account');
            await moveToNextAccount();
            return;
          }
          
          // Navigate to next profile
          const nextUsername = config.currentAccountFollowers[config.currentFollowerIndex];
          console.log(`Moving to next profile: ${nextUsername} (${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length})`);
          
          await updateConfig({
            status: `Processing follower ${config.currentFollowerIndex + 1}/${config.currentAccountFollowers.length}`,
            statusType: 'info'
          });
          
          safeNavigate(`https://www.instagram.com/${nextUsername}/`);
          await randomDelay(2000, 3000);
          
        } else if (currentUrl.includes(`instagram.com/${currentAccount}`)) {
          // We're back on the main account page, navigate to first follower
          const firstUsername = config.currentAccountFollowers[config.currentFollowerIndex];
          console.log(`On main account page, navigating to first follower: ${firstUsername}`);
          
          await updateConfig({
            status: `Starting to visit ${config.currentAccountFollowers.length} profiles`,
            statusType: 'info'
          });
          
          if (!safeNavigate(`https://www.instagram.com/${firstUsername}/`)) {
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
          
          if (!safeNavigate(`https://www.instagram.com/${firstUsername}/`)) {
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
      
    } catch (error) {
      console.error('Error in automation:', error);
    }
    
    isProcessing = false;
  }
  
  // Move to next Instagram account
  async function moveToNextAccount() {
    console.log('Moving to next account...');
    
    config.currentAccountIndex++;
    config.currentAccountFollowers = [];
    config.followersCollected = false;
    config.currentFollowerIndex = 0;
    
    if (config.currentAccountIndex >= config.instagramIds.length) {
      // All accounts processed
      await updateConfig({ 
        active: false,
        status: 'Completed! All accounts processed.',
        statusType: 'success'
      });
      return;
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
    
    console.log('Instagram automation initialized with new workflow');
    console.log('Workflow: Collect ALL followers → Visit each profile → Move to next account');
    
    // Start processing loop
    setInterval(processAutomation, 8000);
  }
  
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
