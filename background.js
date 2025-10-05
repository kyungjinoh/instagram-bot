// Background service worker
let checkInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    startMonitoring();
  } else if (message.action === 'stop') {
    stopMonitoring();
  } else if (message.action === 'updateConfig') {
    updateConfig(message.updates);
  } else if (message.action === 'getConfig') {
    getConfig().then(config => sendResponse({ config }));
    return true;
  }
});

// Start monitoring
function startMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Check every 5 seconds if we need to continue automation
  checkInterval = setInterval(async () => {
    const result = await chrome.storage.local.get('config');
    const config = result.config;
    
    if (!config || !config.active) {
      stopMonitoring();
      return;
    }
    
    // Reset hourly counter if needed
    if (Date.now() >= config.hourResetTime) {
      config.followsThisHour = 0;
      config.hourResetTime = Date.now() + 3600000; // 1 hour from now
      await chrome.storage.local.set({ config });
    }
  }, 5000);
}

// Stop monitoring
function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Update configuration
async function updateConfig(updates) {
  const result = await chrome.storage.local.get('config');
  const config = { ...result.config, ...updates };
  await chrome.storage.local.set({ config });
  
  // Notify popup if it's open
  try {
    chrome.runtime.sendMessage({ 
      action: 'updateStats', 
      stats: config,
      status: updates.status,
      statusType: updates.statusType
    });
  } catch (e) {
    // Popup might not be open
  }
}

// Get configuration
async function getConfig() {
  const result = await chrome.storage.local.get('config');
  return result.config || null;
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram School Follower installed');
});


