// CSV data will be loaded from file
let CSV_DATA = null;
let schools = [];

// Load CSV data from file
async function loadCSVData() {
  try {
    const response = await fetch(chrome.runtime.getURL('Copy of School Clicker Bot Context - Sheet1.csv'));
    CSV_DATA = await response.text();
    console.log('CSV data loaded successfully from file');
  } catch (error) {
    console.error('Error loading CSV file:', error);
    // Fallback to embedded data
    CSV_DATA = `School Name,Instagram ID,Abbreviation
American Heritage Schools,"ahpbathletics, ahs_info_stuco, ahpbboyssoccer, heritagewsoc, ahsicehockey","ahs, American, Heritage",1000
The Dalton School,"daltontigersgvb, daltoncommunityservice, daltondiyaclub, daltonxctf, daltongvt, daltonschoolnyc","dalton, ds, tds",400
The Quarry Lane School,"qls.tbt, minds_unwind, qls_classof27, qls.pop, qls.cognicore, qlskeyclub, qlroar","qls, Quarry Lane, Quarry",420
Ethical Culture Fieldston School,"csabfieldston, fieldstonvarsitytheater, thefieldstonnews, ecfs1878","ecfs, fieldston",500
Blair Academy,"blair_varsity_baseball, blairaquatics, blairacademyskiteam, blairtfxc, blair_academy","blair, BA",141
The Village School,"viking_seniors26, vhsboys_soccer, vhs.ndsa, ladyvikings_vb_, tennis.vhs, villagevikings","vhs, vilage, viking",500
Ransom Everglades School,"re_softball, re_boys_volleyball, re_student_philanthropy, ransomevergladesscuba, re_poetry_, ransomevergladesathletics","RE, Ransom Everglades, Ransom, Everglades, RES",340
Milton Academy,"maboyssoccer, mabvsquash, majvbsoccer, ma_skiteam, maclass2026, miltonacademysailing, magirlssoccerr, miltonacademy","MA, milton",200
The Awty International School,"awtyvarsitytennis, reesegk09, awtygirlslacrosse, awtyjvfh, ayahpapayito, awtyintlschool","ais, awty, ",500
Georgetown Day School,"gdswsoccer, gdsvbaseball, gdsmens.tennis, gds_menslax, gds_wrestling, gdswvbball, gdshoppers","Georgetown, gds",300
Maspeth HS,"mhsboysvarssoccer, maspethhsboysvarstrack, maspeth_hs_rugby, maspethhsathletics, maspethhs.badminton, maspethhoops","mhs, maspeth",341
St. Joseph by the Sea HS,"stjosephbythesea, seavikingsbball, seavolleyball, stjseafootball, st.joseph_girlsflagfootball, seavikingsbaseball","st joseph by the sea, sea, sjs",325
Staten Island Technical HS,"sitechso, sitechstudentlife, sithsmercury, msitsoccer, _sammytheseagull, sithskeyclub","siths, sith, sit",468
Susan E. Wagner HS,"wagnerjrotc, sewfalconsjournalism, susanwagnerband, wagnerdance, sewfalcons, wagnerhscheerleading","sewhs, whs, susan wagner, wagner",1000
Archbishop Molloy HS,"molloyhs_varsitybaseball, molloyhs_varsitysoftball_, molloyhs_admissions, molloyhs, molloyhs_athletics","molloyhs, molloy, amhs",502
Benjamin N. Cardozo HS,"benjamincardozohs, cardozocheer_stunt, cardozomocktrial, dozo.fbla, cardozo.wrestling, dozojudgettes","dozo, bnchs, cardozo",991
Forest Hills HS,"fhhsscioly, fhhskeyclub, foresthillstrackandfield, fhhs.athletics, fhhssoccerofficial, fhhsstudentgov","fhhs, forest",1142
Francis Lewis HS,"foresthillshs_nyc, flhsmathoffice, francis.lewis.hoops, flhs_robotics, flhspatriots, lewisculinary","flhs, lewis",1469
Richmond Hill HS,"athletics_rhhs, rhhsfootball, richmondhillhs, rhhschorus, rhhs.baseball, rhhs_cheerleaders","rhhs, richmond hill hs, richmond",566
St. Francis Preparatory School,"stfrancisprep, stfrancisprepathletics, stfrancisprepmusic, sfpfootball, sfpdanceteam, stfrancisprepmensbasketball","sfp, st. francis prep",807
Townsend Harris HS,"townsend_harris_hs, thhssu, harrislam_, thhsperiod, thhskc","thhs, townsend",444
Vanguard HS,"vanguardhsnyc, vanguardhspta, jrecpanthersvball, jrecbvb, jrecpantherscheer, jrecpanthersathletics","vhs, vanguard",135
Stuyvesant HS,"stuyvesanthighschool, stuyvesanths_nyc, stuysu, stuyfootball, stuyspectator, stuyjuniorcaucus","stuy, stuyvesant",1086
Brooklyn Technical HS,"brooklyntech_hs, thetechkey, bthssgo, bktechwrestling, bthsnhs, brooklyntechlibrary","bths, brooklyn tech",1936
Edward R. Murrow HS,"edwardrmurrowhs, murrowboys_basketball, murrowart, murrowtheater, themurrownetwork, murrow.music.official_","ermhs, murrow",1198
Fort Hamilton HS,"forthamiltonbk, fhhstigerbaseball, fthhsalumni, fhhscheerbk, fhhsflagteam, fort2enior5, fthhspta","FHHS, fhhs, fthhs, FTHHS, Fort Hamilton, Fort Hamilton HS",1600
James Madison HS,"jmhsbklyn, jmhsmbb, studentgov_jmhs, athletics_jmhs, jmhs_mentors, jmhs.badminton","jmhs, mhs, james mdhs",1255
Leon M. Goldstein HS,"lmghs, goldsteinkeyclub, lmghss.2027, lmghs2026, lmghs.2028, lmghs_nhs","lmghs, lmg",333
Midwood HS,"midwoodhsunicef. midwooddebateteam, mhsasianfest, midwoodphsclub, midwoodaerspace","Midwood, midwood, mhs, MHS",1302
Poly Prep Country Day School,"polyprep, polypreparts, polybluedevils, polyprepbase, polystudentgovernment, themorningdevil","poly prep, poly",383
Saint Ann's School,"sasvarsitysoccer, saint_annas_computer_center, sasblackstudentunion, sasboysjvsoccer","Saint Ann's , sas, SAS, saint ann's, saint anns",548
Xaverian HS,"xaverian_volleyball, xaverianvarsitytennis, xhsgsoccer, xaverianhsbaseball, xaverianxctf, xaveriangirlsvaristyswim","xhs, xaverian",550
Harry S Truman HS,"truman.hs, trumanhsbxathletics, trumanbaseballnyc, truman_hs_bb, trumanmustangwrestling, trumanbasketball","hst, hsths",552
La Cañada HS,"lacanadahighschool, lchscollegeandcareer, la_canada_marching_band, lacanadaathletics, thespartannews, lchsasb","lchs, lc",
Troy HS,"troyhighasb, troywarriors, troyhsfbla, troywarriorsathletics, troynjrotc, troyhighmusicprogram","ths, troy",
Orange County School of the Arts (OCSA),"weareocsa, ocsaballroom, ocsapopularmusic, ocsacmd, ocsa_cah, ocsamt","ocsa, orange county school of the arts",751
Redondo Union HS,"sammyseahawk, redondoathletics, ruhs_asb, ruhsfootball, ruhshoops, ruhscheer",ruhs,991
South Pasadena Senior HS,,,
Irvine HS,,,
Portola HS,,,
Diamond Bar HS,"dbhstheater, dbhsorg, fbla.dbhs, dbhs_events, diamondbarusb, dbhsmusic","dbhs, db",844
Cerritos HS,"cerritosmao, cerritos_lowbrass, cerritosmsu, cerritostennis, cerritohs_athletics, cerritohs.bec ","chs, CHS, Cerritos, cerritos",694
La Quinta HS,,,770
Northwood HS,"northwoodhs, northwood.msa, nhs.marching, northwoodhsgolf, nhs_collegencareer, northwoodswimanddive","NHS, nhs, Northwood, northwood",
Sunny Hills HS,"sunnyhillstfxc, sunnyhillsathletics, sunnyhillscolorguard, sunnyhillspercussion, shhs_epic_engineering","shhs, SHHS, Sunny Hills, sunny hills",
Glen A. Wilson HS,,,
Woodbridge HS,"woodbridge_hs, woodbridge_ptsa, woodbridge_warriors, woodbridge_ice_hockey, whstrack_, warriors_whs","whs, WHS, woodbridge, Woodbridge",650
Arnold O. Beckman HS,,,
Fountain Valley HS,"fvhs_athletics, fvhsfca, fvhssurf, fvhs.crosscountry, fountainvalleycolorguard","fvhs, FVHS, Fountain Valley, fountain valley",1043
Santa Monica HS,"samohi.surfteam, samoclass27, samoclass26","samo, Samo, Santa Monica, santa monica, samohi, smhs, Smhs",857
El Segundo HS,,,
West Ranch HS,,,
Walnut HS,"walnuthigh_asb, walnut_mustangs, whsbluethunderband, whs.mustangathletics, walnutfbla, walnutfootball","whs, walnut",713
Crescenta Valley HS,,,
Mark Keppel HS,,,
Valencia HS,,,
Gabrielino HS,"gabrielino_peer_helping, gabrielinobaseball, gab_hs_music, gabrielino_baseball, gemr_brass, ghs.crochet.club","ghs, Ghs, ",494
Mira Costa HS,"mchsdramatechdepartment, mchs.girlsgolf, mchsbands, miracosta_girlsflag, costaboyswp","mchs, Mchs, MCHS",830
Monta Vista HS,"montavistawaterpolo, mvhstunt, montavistaptca, mvhs28, mvphyseng","mvhs, MVHS, Mvhs",
Walter Payton College Preparatory HS,,,
Northside College Preparatory HS,,,
Whitney M. Young Magnet HS,,,
Jones College Prep HS,,,
Adlai E Stevenson HS,,,
Hinsdale Central HS,,,
Vernon Hills HS,,,
Neuqua Valley HS,,,
New Trier Township HS,newtrierhs_santa,"NT, NTHS",
William Fremd HS,fremdhs_santa,"wfhs, ",
John Hersey HS,,,
Lake Forest HS,,,
Deerfield HS,,,
Glenbrook North HS,,,
Libertyville HS,,,
Naperville Central HS,,,
Barrington HS,,,
Maine South HS,,,
Munster HS,,,
Prospect HS,,,
Naperville North HS,,,
Glenbard West HS,,,
Highland Park HS,,,
Metea Valley HS,,,
Oak Park and River Forest HS,,,
Phillips Academy Andover,,,
Phillips Exeter Academy,"phillipsexeter, phillipsexeterdance, phillipsacademy, exetergirlslacrosse, exeterfieldhockey, pea_lib","pea, Exeter, PEA",368
Harvard-Westlake School,"hwgirslwaterpolo, hw_surfclub, hwfanatics, hwfieldhockey, hwspirit, hwbaseball","Harvard-Westlake , harvard-westlake, HW, hw, westlake",540
The Pingry School,"pg_waterpolo, __pg.xc__, pingry_summer, pingry_outing_club, pingryschoolhonorboard, pingryjournalclub","Pingry, pingry, tps",400
St. John's School,,,
Rye Country Day School,"ryecountryday, ryecountrydayschool, rcdsfilmclub, rcdsprom2025, rye_country_day_mun, rcdsathletics","RCDS, rcds, Rye Country Day School, Rye Country",300
Horace Mann School,"horace_mann_trojans, hmalumni, hmcstigers6, horacemannschoolnyc, horacemanncoco, horacemannlions","Horace Mann, horace mann, hm, HM",592
Trinity School,"trinityschoolnyc, voice_of_trinity, trinityschoolcollegeoffice","trinity, Trinity, nyc, ts",333
Sidwell Friends School,"sidwellfriends, sidwell_tf, sidwellsummer, sidwellfriendslibrary, sfsquackers","Sidwell, Sfs, sidwell",380
The John Cooper School,"cooper_dupuis21, thejohncooperschoolclumni, jcdragonxc, jcs_boysbball, cooper_varsity_boys_soccer, jcs.finearts, andres_valenzuelav","jcs, JCS, Jcs, cooper",459
Berkeley Preparatory School,"bpsredcrossclub, berkxctf, bps_rowing, alessandraverfailie, bps_varcity_soccer, berkelyprepalumni, bpsspiritualife","Bps, bps, BPS, berkeley",476
The Hockaday School,"annabellagriggs, hockadayhypewomen, thehockadayschool, hockadayathletics, hockascience, hockadaysocialimpact","hday, Hockaday, ths",363
Bellarmine College Prep,"bcplacrosse, bcp.polevault, bellarmine_ccc, bcprugby, bcp.redcrossclub, thebellarminebellarman","BPS, bps, bellarmine",555
Lynbrook HS,,,
Lowell HS,"lowell_bsu, lowelltech, lhsfilam, lowellhsbsu, thelowell, lowellhistoryclub, lhslatinclub","lhs, LHS, Lowell",846
Sierra Canyon School,,,
Choate Rosemarry Hall,,,
Shree Saraswathi Vidhya Mandheer,,,
Lambert High School,,LHS,`;
  }
}

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
    const maxFollowString = fields[3] ? fields[3].trim() : '';
    
    // Parse Instagram IDs - handle empty or missing values
    const instagramIds = instagramIdsString ? 
      instagramIdsString.split(',').map(id => id.trim()).filter(id => id) : 
      [];
    
    // Parse abbreviations - handle empty or missing values
    const abbreviations = abbreviationsString ? 
      abbreviationsString.split(',').map(abbr => abbr.trim()).filter(abbr => abbr) : 
      [];
    
    // Parse max follow count
    const maxFollow = maxFollowString && !isNaN(parseInt(maxFollowString)) ? 
      parseInt(maxFollowString) : null;
    
    // Skip schools with no data
    if (!schoolName && instagramIds.length === 0 && abbreviations.length === 0) {
      return null;
    }
    
    return {
      id: index,
      name: schoolName,
      instagramIds: instagramIds,
      abbreviations: abbreviations,
      maxFollow: maxFollow
    };
  }).filter(school => school !== null); // Remove null entries
}

// Populate school dropdown
function populateSchools() {
  const select = document.getElementById('schoolSelect');
  schools.forEach(school => {
    const option = document.createElement('option');
    option.value = school.id;
    const maxFollowText = school.maxFollow ? ` - Max: ${school.maxFollow}` : '';
    option.textContent = `${school.name} (${school.instagramIds.length} accounts${maxFollowText})`;
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
  
  // Show different stats based on phase
  if (stats.phase === 'following_expansion') {
    // Calculate unprocessed following count
    const unprocessedCount = stats.followingList?.length 
      ? stats.followingList.filter(u => !stats.processedFollowingAccounts?.includes(u)).length 
      : 0;
    document.getElementById('statAccounts').textContent = 
      `Following: ${unprocessedCount} remaining`;
  } else {
    document.getElementById('statAccounts').textContent = 
      `${stats.currentAccountIndex + 1}/${stats.totalAccounts}`;
  }
  
  document.getElementById('statHourly').textContent = `${stats.followsThisHour}/5`;
  document.getElementById('statTotal').textContent = stats.totalFollows;
  
  // Update break status display
  updateBreakStatus(stats);
}

// Update break status display
function updateBreakStatus(stats) {
  const breakStatusDiv = document.getElementById('breakStatus');
  if (!breakStatusDiv) return;
  
  if (stats.isOn6HourBreak) {
    const now = Date.now();
    const remainingTime = stats.breakEndTime - now;
    
    if (remainingTime > 0) {
      const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      const breakEndDate = new Date(stats.breakEndTime);
      
      breakStatusDiv.innerHTML = `
        <div class="break-status active">
          <h4>🚨 6-Hour Break Active</h4>
          <p>Remaining: ${remainingHours}h ${remainingMinutes}m</p>
          <p>Resumes: ${breakEndDate.toLocaleString()}</p>
        </div>
      `;
      breakStatusDiv.style.display = 'block';
    } else {
      // Break should be over
      breakStatusDiv.style.display = 'none';
    }
  } else {
    breakStatusDiv.style.display = 'none';
  }
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
  const breakTestMode = document.getElementById('breakTestMode').checked;
  const phase2TestMode = document.getElementById('phase2TestMode').checked;
  
  if (!ownUsername) {
    showStatus('Please enter your Instagram username', 'error');
    return;
  }
  
  // Validate that only one test mode is selected
  const testModeCount = [testMode, breakTestMode, phase2TestMode].filter(Boolean).length;
  if (testModeCount > 1) {
    showStatus('Please select only one test mode', 'error');
    return;
  }
  
  // Validate school selection - ALWAYS required (for both phases, except test modes)
  if (isNaN(schoolId) && !testMode && !breakTestMode && !phase2TestMode) {
    showStatus('Please select a school - required for bio filtering', 'error');
    return;
  }
  
  let school = null;
  let validStartIndex = 0;
  let instagramIds = [];
  let abbreviations = [];
  let schoolName = '';
  let totalAccounts = 0;
  let maxFollow = null;
  
  // Get school data for both phases (school selection is now required)
  if (!isNaN(schoolId)) {
    school = schools[schoolId];
    schoolName = school.name;
    abbreviations = school.abbreviations;
    maxFollow = school.maxFollow;
    instagramIds = school.instagramIds; // Always set instagramIds for both phases
    totalAccounts = school.instagramIds.length;
    
    // Additional setup for school phase
    if (startPhase === 'school') {
      validStartIndex = Math.max(0, Math.min(startAccountIndex, school.instagramIds.length - 1));
    } else {
      validStartIndex = 0; // Following expansion doesn't use account index
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
  
  // Break test mode profile
  const breakTestProfile = 'anna_calbos';
  
  // Phase 2 test mode - simulated following accounts (process 1 follower from each)
  const phase2TestFollowing = [
    'jonathankolon1',
    'julianne.t.2028'
  ];

  // Save configuration to storage
  const config = {
    active: true,
    phase: startPhase, // 'school' or 'following_expansion'
    ownUsername: ownUsername,
    enableFollowingExpansion: enableFollowingExpansion,
    testMode: testMode,
    testProfiles: testProfiles,
    breakTestMode: breakTestMode,
    breakTestProfile: breakTestProfile,
    phase2TestMode: phase2TestMode,
    phase2TestFollowing: phase2TestFollowing,
    schoolId: schoolId,
    schoolName: schoolName,
    instagramIds: instagramIds,
    abbreviations: abbreviations,
    maxFollow: maxFollow,
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
  } else if (breakTestMode) {
    startMessage = `⏰ BREAK TEST MODE: Testing 6-hour break functionality with @${breakTestProfile}`;
    startUrl = `https://www.instagram.com/${breakTestProfile}/`;
  } else if (phase2TestMode) {
    startMessage = `🔄 PHASE 2 TEST MODE: Testing with ${phase2TestFollowing.length} accounts (1 follower each)`;
    startUrl = `https://www.instagram.com/${phase2TestFollowing[0]}/`;
  } else if (startPhase === 'school') {
    const startAccount = school.instagramIds[validStartIndex];
    startMessage = validStartIndex === 0 ? 'Starting from first school account' : `Starting from school account ${validStartIndex + 1}/${school.instagramIds.length}`;
    startMessage += `: ${startAccount}`;
    if (maxFollow) {
      startMessage += ` (Max: ${maxFollow} follows)`;
    }
    startUrl = `https://www.instagram.com/${startAccount}/`;
  } else if (startPhase === 'following_expansion') {
    startMessage = `Starting Following Expansion from your profile: ${ownUsername}`;
    if (schoolName) {
      startMessage += ` (Filtering for: ${schoolName})`;
    }
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
    if (result.config.breakTestMode !== undefined) {
      document.getElementById('breakTestMode').checked = result.config.breakTestMode;
    }
    if (result.config.phase2TestMode !== undefined) {
      document.getElementById('phase2TestMode').checked = result.config.phase2TestMode;
    }
  }
}

// Toggle visibility of account select based on start phase
function toggleAccountSelectVisibility() {
  const startPhase = document.getElementById('startPhase').value;
  const accountSelectGroup = document.getElementById('accountSelectGroup');
  const schoolSelect = document.getElementById('schoolSelect');
  
  // School selection is ALWAYS required now
  schoolSelect.required = true;
  
  if (startPhase === 'following_expansion') {
    // Hide account selection for following expansion (not applicable)
    accountSelectGroup.style.display = 'none';
  } else {
    // Show account selection for school phase
    accountSelectGroup.style.display = 'block';
  }
}

// Initialize
async function initialize() {
  await loadCSVData();
  parseCSV();
  populateSchools();
  loadState();
}

initialize();

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
