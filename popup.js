// CSV data embedded directly
const CSV_DATA = `School Name,Instagram ID,Abbreviation
American Heritage Schools,"ahpbathletics, ahs_info_stuco, ahpbboyssoccer, heritagewsoc, ahsicehockey","ahs, American, Heritage"
The Dalton School,"daltontigersgvb, daltoncommunityservice, daltondiyaclub, daltonxctf, daltongvt, daltonschoolnyc","dalton, ds, tds"
The Quarry Lane School,"qls.tbt, minds_unwind, qls_classof27, qls.pop, qls.cognicore, qlskeyclub, qlroar","qls, Quarry Lane, Quarry"
Ethical Culture Fieldston School,"csabfieldston, fieldstonvarsitytheater, thefieldstonnews, ecfs1878","ecfs, fieldston"
Blair Academy,"blair_varsity_baseball, blairaquatics, blairacademyskiteam, blairtfxc, blair_academy","blair, BA"
The Village School,"viking_seniors26, vhsboys_soccer, vhs.ndsa, ladyvikings_vb_, tennis.vhs, villagevikings","vhs, vilage, viking"
Ransom Everglades School,"re_softball, re_boys_volleyball, re_student_philanthropy, ransomevergladesscuba, re_poetry_, ransomevergladesathletics","RE, Ransom Everglades, Ranson, Everglades, RES"
Milton Academy,"maboyssoccer, mabvsquash, majvbsoccer, ma_skiteam, maclass2026, miltonacademysailing, magirlssoccerr, miltonacademy","MA, milton"
The Awty International School,"awtyvarsitytennis, reesegk09, awtygirlslacrosse, awtyjvfh, ayahpapayito, awtyintlschool","ais, awty, "
Georgetown Day School,"gdswsoccer, gdsvbaseball, gdsmens.tennis, gds_menslax, gds_wrestling, gdswvbball, gdshoppers","Georgetown Day School, gds"`;

let schools = [];

// Parse CSV data
function parseCSV() {
  const lines = CSV_DATA.trim().split('\n');
  const headers = lines[0].split(',');
  
  schools = lines.slice(1).map((line, index) => {
    // Handle quoted fields with commas
    const regex = /"([^"]*)"|([^,]+)/g;
    const fields = [];
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      fields.push(match[1] || match[2]);
    }
    
    const schoolName = fields[0].trim();
    const instagramIds = fields[1].split(',').map(id => id.trim());
    const abbreviations = fields[2].split(',').map(abbr => abbr.trim()).filter(a => a);
    
    return {
      id: index,
      name: schoolName,
      instagramIds: instagramIds,
      abbreviations: abbreviations
    };
  });
}

// Populate school dropdown
function populateSchools() {
  const select = document.getElementById('schoolSelect');
  schools.forEach(school => {
    const option = document.createElement('option');
    option.value = school.id;
    option.textContent = `${school.name} (${school.instagramIds.length} accounts)`;
    select.appendChild(option);
  });
}

// Populate account dropdown based on selected school
function populateAccounts(schoolId) {
  const accountSelect = document.getElementById('accountSelect');
  
  // Clear existing options except the first one
  accountSelect.innerHTML = '<option value="">-- Start from first account --</option>';
  
  if (schoolId !== '' && !isNaN(schoolId)) {
    const school = schools[parseInt(schoolId)];
    if (school && school.instagramIds) {
      school.instagramIds.forEach((account, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${account} (Account ${index + 1})`;
        accountSelect.appendChild(option);
      });
    }
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status active ${type}`;
}

// Update stats display
function updateStats(stats) {
  if (!stats) return;
  
  const statsDiv = document.getElementById('stats');
  statsDiv.classList.add('active');
  
  document.getElementById('statSchool').textContent = stats.schoolName || '-';
  document.getElementById('statAccounts').textContent = 
    `${stats.currentAccountIndex + 1}/${stats.totalAccounts}`;
  document.getElementById('statHourly').textContent = `${stats.followsThisHour}/5`;
  document.getElementById('statTotal').textContent = stats.totalFollows;
}

// Start automation
async function startAutomation() {
  const schoolId = parseInt(document.getElementById('schoolSelect').value);
  const currentFollowing = parseInt(document.getElementById('currentFollowing').value) || 0;
  const startAccountIndex = parseInt(document.getElementById('accountSelect').value) || 0;
  const ownUsername = document.getElementById('ownUsername').value.trim();
  const enableFollowingExpansion = document.getElementById('enableFollowingExpansion').checked;
  const startPhase = document.getElementById('startPhase').value;
  
  if (!ownUsername) {
    showStatus('Please enter your Instagram username', 'error');
    return;
  }
  
  // Validate school selection only if starting from school phase
  if (startPhase === 'school' && isNaN(schoolId)) {
    showStatus('Please select a school', 'error');
    return;
  }
  
  let school = null;
  let validStartIndex = 0;
  let instagramIds = [];
  let abbreviations = [];
  let schoolName = '';
  let totalAccounts = 0;
  
  if (startPhase === 'school' && !isNaN(schoolId)) {
    school = schools[schoolId];
    schoolName = school.name;
    instagramIds = school.instagramIds;
    abbreviations = school.abbreviations;
    totalAccounts = school.instagramIds.length;
    validStartIndex = Math.max(0, Math.min(startAccountIndex, school.instagramIds.length - 1));
  } else if (startPhase === 'following_expansion') {
    // For following expansion, we still need abbreviations for filtering
    // Use the selected school's abbreviations if available, otherwise empty
    if (!isNaN(schoolId)) {
      school = schools[schoolId];
      abbreviations = school.abbreviations;
      schoolName = school.name;
    } else {
      // Default to empty - will match all users
      abbreviations = [];
      schoolName = 'Any School';
    }
  }
  
  // Save configuration to storage
  const config = {
    active: true,
    phase: startPhase, // 'school' or 'following_expansion'
    ownUsername: ownUsername,
    enableFollowingExpansion: enableFollowingExpansion,
    schoolId: schoolId,
    schoolName: schoolName,
    instagramIds: instagramIds,
    abbreviations: abbreviations,
    currentFollowing: currentFollowing,
    currentAccountIndex: validStartIndex,
    totalFollows: 0,
    followsThisHour: 0,
    lastFollowTime: null,
    hourResetTime: Date.now() + 3600000, // 1 hour from now
    totalAccounts: totalAccounts,
    currentAccountFollowers: [],
    followersCollected: false,
    currentFollowerIndex: 0,
    // Following expansion phase data
    followingList: [],
    followingCollected: false,
    currentFollowingIndex: 0,
    processedFollowingAccounts: []
  };
  
  await chrome.storage.local.set({ config: config });
  
  // Update UI
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'block';
  showStatus('Starting automation...', 'success');
  updateStats(config);
  
  // Open appropriate Instagram page based on starting phase
  let startUrl = '';
  let startMessage = '';
  
  if (startPhase === 'school') {
    const startAccount = school.instagramIds[validStartIndex];
    startMessage = validStartIndex === 0 ? 'Starting from first school account' : `Starting from school account ${validStartIndex + 1}/${school.instagramIds.length}`;
    startMessage += `: ${startAccount}`;
    startUrl = `https://www.instagram.com/${startAccount}/`;
  } else if (startPhase === 'following_expansion') {
    startMessage = `Starting Following Expansion from your profile: ${ownUsername}`;
    startUrl = `https://www.instagram.com/${ownUsername}/`;
  }
  
  showStatus(startMessage, 'info');
  
  chrome.tabs.create({ 
    url: startUrl,
    active: true
  });
  
  // Notify background script
  chrome.runtime.sendMessage({ action: 'start' });
}

// Stop automation
async function stopAutomation() {
  await chrome.storage.local.set({ config: { active: false } });
  
  document.getElementById('startBtn').style.display = 'block';
  document.getElementById('stopBtn').style.display = 'none';
  showStatus('Automation stopped', 'info');
  
  chrome.runtime.sendMessage({ action: 'stop' });
}

// Load current state
async function loadState() {
  const result = await chrome.storage.local.get('config');
  if (result.config && result.config.active) {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';
    showStatus('Automation is running...', 'success');
    updateStats(result.config);
    
    // Set the school and account selections if automation is running
    document.getElementById('schoolSelect').value = result.config.schoolId;
    populateAccounts(result.config.schoolId);
    document.getElementById('accountSelect').value = result.config.currentAccountIndex;
    if (result.config.ownUsername) {
      document.getElementById('ownUsername').value = result.config.ownUsername;
    }
    if (result.config.enableFollowingExpansion !== undefined) {
      document.getElementById('enableFollowingExpansion').checked = result.config.enableFollowingExpansion;
    }
    if (result.config.phase) {
      document.getElementById('startPhase').value = result.config.phase;
      toggleAccountSelectVisibility();
    }
  }
}

// Toggle visibility of account select based on start phase
function toggleAccountSelectVisibility() {
  const startPhase = document.getElementById('startPhase').value;
  const accountSelectGroup = document.getElementById('accountSelectGroup');
  const schoolSelect = document.getElementById('schoolSelect');
  
  if (startPhase === 'following_expansion') {
    accountSelectGroup.style.display = 'none';
    schoolSelect.required = false;
  } else {
    accountSelectGroup.style.display = 'block';
    schoolSelect.required = true;
  }
}

// Initialize
parseCSV();
populateSchools();
loadState();

document.getElementById('startBtn').addEventListener('click', startAutomation);
document.getElementById('stopBtn').addEventListener('click', stopAutomation);
document.getElementById('schoolSelect').addEventListener('change', function() {
  populateAccounts(this.value);
});
document.getElementById('startPhase').addEventListener('change', toggleAccountSelectVisibility);

// Listen for updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    updateStats(message.stats);
    if (message.status) {
      showStatus(message.status, message.statusType || 'info');
    }
  }
});

