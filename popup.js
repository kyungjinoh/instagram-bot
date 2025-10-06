// CSV data embedded directly
const CSV_DATA = `School Name,Instagram ID (5-6),Abbreviation (keyword that bot will detect in people's bio)
American Heritage Schools,"ahpbathletics, ahs_info_stuco, ahpbboyssoccer, heritagewsoc, ahsicehockey","ahs, American, Heritage"
The Dalton School,"daltontigersgvb, daltoncommunityservice, daltondiyaclub, daltonxctf, daltongvt, daltonschoolnyc","dalton, ds, tds"
The Quarry Lane School,"qls.tbt, minds_unwind, qls_classof27, qls.pop, qls.cognicore, qlskeyclub, qlroar","qls, Quarry Lane, Quarry"
Ethical Culture Fieldston School,"csabfieldston, fieldstonvarsitytheater, thefieldstonnews, ecfs1878","ecfs, fieldston"
Blair Academy,"blair_varsity_baseball, blairaquatics, blairacademyskiteam, blairtfxc, blair_academy","blair, BA"
The Village School,"viking_seniors26, vhsboys_soccer, vhs.ndsa, ladyvikings_vb_, tennis.vhs, villagevikings","vhs, vilage, viking"
Ransom Everglades School,"re_softball, re_boys_volleyball, re_student_philanthropy, ransomevergladesscuba, re_poetry_, ransomevergladesathletics","RE, Ransom Everglades, Ransom, Everglades, RES"
Milton Academy,"maboyssoccer, mabvsquash, majvbsoccer, ma_skiteam, maclass2026, miltonacademysailing, magirlssoccerr, miltonacademy","MA, milton"
The Awty International School,"awtyvarsitytennis, reesegk09, awtygirlslacrosse, awtyjvfh, ayahpapayito, awtyintlschool","ais, awty, "
Georgetown Day School,"gdswsoccer, gdsvbaseball, gdsmens.tennis, gds_menslax, gds_wrestling, gdswvbball, gdshoppers","Georgetown, gds"
Maspeth HS,"mhsboysvarssoccer, maspethhsboysvarstrack, maspeth_hs_rugby, maspethhsathletics, maspethhs.badminton, maspethhoops","mhs, maspeth"
St. Joseph by the Sea HS,"stjosephbythesea, seavikingsbball, seavolleyball, stjseafootball, st.joseph_girlsflagfootball, seavikingsbaseball","st joseph by the sea, sea, sjs"
Staten Island Technical HS,"sitechso, sitechstudentlife, sithsmercury, msitsoccer, _sammytheseagull, sithskeyclub","siths, sith, sit"
Susan E. Wagner HS,"wagnerjrotc, sewfalconsjournalism, susanwagnerband, wagnerdance, sewfalcons, wagnerhscheerleading","sewhs, whs, susan wagner, wagner"
Archbishop Molloy HS,"molloyhs_varsitybaseball, molloyhs_varsitysoftball_, molloyhs_admissions, molloyhs, molloyhs_athletics","molloyhs, molloy, amhs"
Benjamin N. Cardozo HS,"benjamincardozohs, cardozocheer_stunt, cardozomocktrial, dozo.fbla, cardozo.wrestling, dozojudgettes","dozo, bnchs, cardozo"
Forest Hills HS,"fhhsscioly, fhhskeyclub, foresthillstrackandfield, fhhs.athletics, fhhssoccerofficial, fhhsstudentgov","fhhs, forest hills"
Francis Lewis HS,"foresthillshs_nyc, flhsmathoffice, francis.lewis.hoops, flhs_robotics, flhspatriots, lewisculinary","flhs, lewis"
Richmond Hill HS,"athletics_rhhs, rhhsfootball, richmondhillhs, rhhschorus, rhhs.baseball, rhhs_cheerleaders","rhhs, richmond hill hs, richmond hill"
St. Francis Preparatory School,"stfrancisprep, stfrancisprepathletics, stfrancisprepmusic, sfpfootball, sfpdanceteam, stfrancisprepmensbasketball","sfp, st. francis prep"
Townsend Harris HS,"townsend_harris_hs, thhssu, harrislam_, thhsperiod, thhskc","thhs, townsend"
Vanguard HS,stuyvesanths_nyc,
Stuyvesant HS,,
Brooklyn Technical HS,,
Edward R. Murrow HS,,
Fort Hamilton HS,"forthamiltonbk, fhhstigerbaseball, fthhsalumni, fhhscheerbk, fhhsflagteam, fort2enior5, fthhspta","FHHS, fhhs, fthhs, FTHHS, Fort Hamilton, Fort Hamilton HS"
James Madison HS,,
Leon M. Goldstein HS,,
Midwood HS,"midwoodhsunicef. midwooddebateteam, mhsasianfest, midwoodphsclub, midwoodaerspace","Midwood, midwood, mhs, MHS"
Poly Prep Country Day School,,
Saint Ann's School,"sasvarsitysoccer, saint_annas_computer_center, sasblackstudentunion, sasboysjvsoccer","Saint Ann's , sas, SAS, saint ann's"
Xaverian HS,"xaverian_volleyball, xaverianvarsitytennis, xhsgsoccer, xaverianhsbaseball, xaverianxctf, xaveriangirlsvaristyswim","xhs, xaverian"
Harry S Truman HS,,
La Cañada HS,,
Troy HS,"troyhighasb, troywarriors, troyhsfbla, troywarriorsathletics, troynjrotc, troyhighmusicprogram","ths, troy"
Orange County School of the Arts (OCSA),"weareocsa, ocsaballroom, ocsapopularmusic, ocsacmd, ocsa_cah, ocsamt","ocsa, orange county school of the arts"
Redondo Union HS,,
South Pasadena Senior HS,,
Irvine HS,,
Portola HS,,
Diamond Bar HS,"dbhstheater, dbhsorg, fbla.dbhs, dbhs_events, diamondbarusb, dbhsmusic","dbhs, db"
Cerritos HS,,
La Quinta HS,,
Northwood HS,,
Sunny Hills HS,,
Glen A. Wilson HS,,
Woodbridge HS,,
Arnold O. Beckman HS,,
Fountain Valley HS,,
Santa Monica HS,,
El Segundo HS,,
West Ranch HS,,
Walnut HS,"walnuthigh_asb, walnut_mustangs, whsbluethunderband, whs.mustangathletics, walnutfbla, walnutfootball","whs, walnut"
Crescenta Valley HS,,
Mark Keppel HS,,
Valencia HS,,
Gabrielino HS,,
Mira Costa HS,,
Monta Vista HS,,
Walter Payton College Preparatory HS,,
Northside College Preparatory HS,,
Whitney M. Young Magnet HS,,
Jones College Prep HS,,
Adlai E Stevenson HS,,
Hinsdale Central HS,,
Vernon Hills HS,,
Neuqua Valley HS,,
New Trier Township HS,newtrierhs_santa,"NT, NTHS"
William Fremd HS,fremdhs_santa,"wfhs, "
John Hersey HS,,
Lake Forest HS,,
Deerfield HS,,
Glenbrook North HS,,
Libertyville HS,,
Naperville Central HS,,
Barrington HS,,
Maine South HS,,
Munster HS,,
Prospect HS,,
Naperville North HS,,
Glenbard West HS,,
Highland Park HS,,
Metea Valley HS,,
Oak Park and River Forest HS,,
Phillips Academy Andover,,
Phillips Exeter Academy,"phillipsexeter, phillipsexeterdance, phillipsacademy, exetergirlslacrosse, exeterfieldhockey, pea_lib","pea, Philips Exeter, PEA"
Harvard-Westlake School,"hwgirslwaterpolo, hw_surfclub, hwfanatics, hwfieldhockey, hwspirit, hwbaseball","Harvard-Westlake , harward-westlake, HW, hw"
The Pingry School,"pg_waterpolo, __pg.xc__, pingry_summer, pingry_outing_club, pingryschoolhonorboard, pingryjournalclub","Pingry, pingry, tps"
St. John's School,,
Rye Country Day School,"ryecountryday, ryecountrydayschool, rcdsfilmclub, rcdsprom2025, rye_country_day_mun, rcdsathletics","RCDS, rcds, Rye Country Day School, Rye Country"
Horace Mann School,"horace_mann_trojans, hmalumni, hmcstigers6, horacemannschoolnyc, horacemanncoco, horacemannlions","Horace Mann, horace mann, hm, HM"
Trinity School,"trinityschoolnyc, voice_of_trinity, trinityschoolcollegeoffice","trinity, Trinity, nyc, ts"
Sidwell Friends School,"sidwellfriends, sidwell_tf, sidwellsummer, sidwellfriendslibrary, sfsquackers","Sidwell, Sfs, sidwell"
The John Cooper School,"cooper_dupuis21, thejohncooperschoolclumni, jcdragonxc, jcs_boysbball, cooper_varsity_boys_soccer, jcs.finearts, andres_valenzuelav","jcs, JCS, Jcs, cooper"
Berkeley Preparatory School,"bpsredcrossclub, berkxctf, bps_rowing, alessandraverfailie, bps_varcity_soccer, berkelyprepalumni, bpsspiritualife","Bps, bps, BPS, berkeley"
The Hockaday School,"annabellagriggs, hockadayhypewomen, thehockadayschool, hockadayathletics, hockascience, hockadaysocialimpact","hday, Hockaday, ths"
Bellarmine College Prep,"bcplacrosse, bcp.polevault, bellarmine_ccc, bcprugby, bcp.redcrossclub, thebellarminebellarman","BPS, bps, bellarmine"
Lynbrook HS,,
Lowell HS,"lowell_bsu, lowelltech, lhsfilam, lowellhsbsu, thelowell, lowellhistoryclub, lhslatinclub","lhs, LHS, Lowell"
Sierra Canyon School,,
Choate Rosemarry Hall,,
Shree Saraswathi Vidhya Mandheer,,
Lambert High School,,LHS`;

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
    
    const schoolName = fields[0] ? fields[0].trim() : '';
    const instagramIdsString = fields[1] ? fields[1].trim() : '';
    const abbreviationsString = fields[2] ? fields[2].trim() : '';
    
    // Parse Instagram IDs - handle empty or missing values
    const instagramIds = instagramIdsString ? 
      instagramIdsString.split(',').map(id => id.trim()).filter(id => id) : 
      [];
    
    // Parse abbreviations - handle empty or missing values
    const abbreviations = abbreviationsString ? 
      abbreviationsString.split(',').map(abbr => abbr.trim()).filter(abbr => abbr) : 
      [];
    
    // Skip schools with no data
    if (!schoolName && instagramIds.length === 0 && abbreviations.length === 0) {
      return null;
    }
    
    return {
      id: index,
      name: schoolName,
      instagramIds: instagramIds,
      abbreviations: abbreviations
    };
  }).filter(school => school !== null); // Remove null entries
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
  const testMode = document.getElementById('testMode').checked;
  
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
  
  // Test mode profiles
  const testProfiles = [
    'jordan_.edw',
    'brinmee',
    'niccolo_ls',
    'arman.bickici',
    'ikroop_chanana',
    'oliviamorakis'
  ];

  // Save configuration to storage
  const config = {
    active: true,
    phase: startPhase, // 'school' or 'following_expansion'
    ownUsername: ownUsername,
    enableFollowingExpansion: enableFollowingExpansion,
    testMode: testMode,
    testProfiles: testProfiles,
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
  
  if (testMode) {
    startMessage = `🧪 TEST MODE: Testing with ${testProfiles.length} specific profiles`;
    startUrl = `https://www.instagram.com/${testProfiles[0]}/`;
  } else if (startPhase === 'school') {
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
    if (result.config.testMode !== undefined) {
      document.getElementById('testMode').checked = result.config.testMode;
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

