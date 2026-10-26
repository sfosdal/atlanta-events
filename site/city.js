// The city — every fact that makes this calendar Atlanta's rather than
// another town's, in one place (2026-10-11: a city on lqa-events, built
// from the Chicago copy). The browser (filter.js, app.js) and the build
// (scripts/*.mjs) both read it; nothing else names a venue or a team. The
// shared files (app.js, filter.js, styles.css bar its --v-* hues,
// scripts/*.mjs bar fetch-events.mjs and sources.mjs) are lqa-events' own,
// byte for byte — see README "Sister sites".
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right. Per team:
  //   re        the title match
  //   venue     the home building; schedule = the club's own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS), the game clock,
  //             the leader categories
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames
  //   espn      ESPN's sport/league/team id — every Atlanta club is on ESPN,
  //             so the season, the form block, news and transactions all
  //             come from there (schedules.mjs); the Braves' season comes
  //             from MLB's stats API (first-pitch times, the standings), as
  //             lqa's Mariners
  //   division  (baseball) the division rivals by the abbreviations the
  //             schedule carries, for the standings line
  //   club      the club's name on Ticketmaster; news the outlets' feeds;
  //             wiki the article; opens when the season usually starts
  var MLB = function (slug) { return ['https://www.mlb.com/' + slug + '/feeds/news/rss.xml', 'MLB.com']; };
  var TEAMS = [
    { slug: 'hawks', label: 'Hawks', re: /\bhawks\b/i, sport: 'basketball', venue: 'State Farm Arena', colors: ['#e03a3e', '#c1d32f'],
      espn: { sport: 'basketball', league: 'nba', id: '1' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png', schedule: 'https://www.nba.com/hawks/schedule',
      club: 'Atlanta Hawks', opens: 'late October', wiki: { title: 'Atlanta Hawks' } },
    { slug: 'falcons', label: 'Falcons', re: /\bfalcons\b/i, sport: 'football', venue: 'Mercedes-Benz Stadium', colors: ['#a71930', '#000000'],
      espn: { sport: 'football', league: 'nfl', id: '1' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png', schedule: 'https://www.atlantafalcons.com/schedule/',
      club: 'Atlanta Falcons', opens: 'September', wiki: { title: 'Atlanta Falcons', startYear: true },
      news: [['https://www.atlantafalcons.com/rss/news', 'AtlantaFalcons.com']] },
    { slug: 'braves', label: 'Braves', re: /\bbraves\b/i, sport: 'baseball', venue: 'Truist Park', colors: ['#ce1141', '#13274f'],
      espn: { sport: 'baseball', league: 'mlb', id: '15' }, season: { kind: 'mlb', id: 144 }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png', schedule: 'https://www.mlb.com/braves/schedule',
      club: 'Atlanta Braves', opens: 'late March', wiki: { title: 'Atlanta Braves' },
      division: ['NYM', 'PHI', 'MIA', 'WSH'], // NL East
      news: [MLB('braves')] },
    { slug: 'united', label: 'United', re: /atlanta united/i, sport: 'soccer', venue: 'Mercedes-Benz Stadium', colors: ['#80000b', '#a19060'],
      espn: { sport: 'soccer', league: 'usa.1', id: '18418' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/18418.png', schedule: 'https://www.atlutd.com/schedule/',
      club: 'Atlanta United FC', opens: 'late February', wiki: { title: 'Atlanta United FC' } },
    { slug: 'dream', label: 'Dream', re: /atlanta dream/i, sport: 'basketball', venue: 'Gateway Center Arena', colors: ['#c8102e', '#418fde'],
      espn: { sport: 'basketball', league: 'wnba', id: '20' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/atl.png', schedule: 'https://dream.wnba.com/schedule/',
      club: 'Atlanta Dream', opens: 'May', wiki: { title: 'Atlanta Dream' } },
    // Georgia Tech football at Bobby Dodd. Men's basketball (McCamish) waits
    // on the shared ESPN adapter asking college hoops for `?seasontype=2`:
    // the plain call returns nothing before November, and app.js's form
    // block throws on an empty schedule.
    { slug: 'yellowjackets', label: 'Yellow Jackets', re: /georgia tech(?!.*basketball)|yellow jackets football/i, sport: 'football', venue: 'Bobby Dodd Stadium', colors: ['#b3a369', '#003057'],
      espn: { sport: 'football', league: 'college-football', id: '59' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/59.png', schedule: 'https://ramblinwreck.com/sports/m-footbl/schedule/',
      club: 'Georgia Tech Yellow Jackets', opens: 'late August', wiki: { title: 'Georgia Tech Yellow Jackets football', teamPage: true } }, // college seasons are titled "2026 … football team"
  ];

  // The venues, one record each — downtown and the stadiums first by size,
  // then the music rooms and the suburbs. Per venue:
  //   capacity how many people the place holds
  //   area     'town' for the music rooms across the city and the suburban
  //            houses (the panel's second group); absent = downtown and
  //            the stadiums
  //   type     the event type when the title decides nothing
  //   cssVar   the hue styles.css sets for it (dark block --v-*); color
  //            the same hue as a value, for the series graph
  //   url      the venue's own events listing — not a ticket vendor
  //   icon     a mark for listings without a team crest
  //   tm       its Ticketmaster Discovery listing (fetch-events.mjs reads
  //            the venue by id — every page). There is NO city sweep here:
  //            a big market lists thousands of events a year and the
  //            API stops a query at its thousandth, three weeks out
  //   alias    the other spellings the feeds use for it, folded to this name
  // No festivals yet, so the panel's Festivals group folds away (app.js).
  var VENUES = {
    // --- Downtown and the stadiums: the arena, the two stadiums and the ballpark, the Fox, Symphony Hall, Cobb Energy, Gas South, Gateway Center and Georgia Tech's grounds ---
    'State Farm Arena': {
      geo: [33.7578, -84.39457],
      capacity: 16600,
      type: 'concert',
      cssVar: '--v-sfa',
      color: '#ea8686',
      url: 'https://www.statefarmarena.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.statefarmarena.com&sz=128',
      tm: { id: 'KovZpa2Xke', match: "state farm arena", fallbackUrl: 'https://www.statefarmarena.com/events', exclude: /parking|tour/i },
      alias: /state farm arena/i,
    },
    'Mercedes-Benz Stadium': {
      geo: [33.75539, -84.40082],
      capacity: 71000,
      type: 'sports',
      cssVar: '--v-mbs',
      color: '#86eaa3',
      url: 'https://mercedesbenzstadium.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=mercedesbenzstadium.com&sz=128',
      tm: { id: 'KovZpZAEdJaA', match: "mercedes-benz stadium", fallbackUrl: 'https://mercedesbenzstadium.com/events/', exclude: /parking|tour/i },
      alias: /mercedes-?benz stadium/i,
    },
    'Truist Park': {
      geo: [33.8903, -84.46813],
      capacity: 41084,
      type: 'sports',
      cssVar: '--v-truist',
      color: '#c086ea',
      url: 'https://www.mlb.com/braves/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=www.mlb.com&sz=128',
      tm: { id: 'KovZpZAtv11A', match: "truist park", fallbackUrl: 'https://www.mlb.com/braves/schedule', exclude: /parking|tour|premium seating/i }, // the postseason's "* Premium Seating *" twins
      alias: /truist park/i,
    },
    'Fox Theatre': {
      geo: [33.77264, -84.38507],
      capacity: 4665,
      type: 'concert',
      cssVar: '--v-fox',
      color: '#eadd86',
      url: 'https://www.foxtheatre.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.foxtheatre.org&sz=128',
      tm: { id: 'KovZpZAdnvEA', match: "fox theatre", fallbackUrl: 'https://www.foxtheatre.org/events', exclude: /tour/i },
      alias: /fox theatre/i,
    },
    'Atlanta Symphony Hall': {
      geo: [33.7901, -84.38549],
      capacity: 1762,
      type: 'arts',
      cssVar: '--v-aso',
      color: '#86d9ea',
      url: 'https://www.aso.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.aso.org&sz=128',
      tm: { id: 'KovZpZAJedlA', match: "symphony hall", fallbackUrl: 'https://www.aso.org/events', exclude: /garage|parking/i }, // the ASO lists its parking deck as a second "show" every night
      alias: /atlanta symphony hall/i,
    },
    'Cobb Energy Centre': {
      geo: [33.88443, -84.45836],
      capacity: 2750,
      type: 'arts',
      cssVar: '--v-cobb',
      color: '#ea86bc',
      url: 'https://www.cobbenergycentre.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.cobbenergycentre.com&sz=128',
      tm: { id: 'KovZpa3j7e', match: "cobb energy", fallbackUrl: 'https://www.cobbenergycentre.com/events' },
      alias: /cobb energy/i,
    },
    'Gas South Arena': {
      geo: [33.98692, -84.09073],
      capacity: 13000,
      type: 'concert',
      cssVar: '--v-gassouth',
      color: '#9fea86',
      url: 'https://www.gassouthdistrict.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.gassouthdistrict.com&sz=128',
      tm: { id: 'KovZpZAEkdvA,Z6r9jZ6aFe', match: "gas south", fallbackUrl: 'https://www.gassouthdistrict.com/events', exclude: /parking/i },
      alias: /gas south/i,
    },
    'Gateway Center Arena': {
      geo: [33.64558, -84.45748],
      capacity: 5000,
      type: 'sports',
      cssVar: '--v-gateway',
      color: '#8a86ea',
      url: 'https://www.gatewaycenterarena.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.gatewaycenterarena.com&sz=128',
      tm: { id: 'KovZ917A-mZ', match: "gateway center", fallbackUrl: 'https://www.gatewaycenterarena.com/events' },
      alias: /gateway center/i,
    },
    'Bobby Dodd Stadium': {
      geo: [33.77394, -84.3957],
      capacity: 55000,
      type: 'sports',
      cssVar: '--v-dodd',
      color: '#eaa786',
      url: 'https://ramblinwreck.com/sports/m-footbl/schedule/',
      icon: 'https://www.google.com/s2/favicons?domain=ramblinwreck.com&sz=128',
      tm: { id: 'KovZpa94Xe', match: "bobby dodd", fallbackUrl: 'https://ramblinwreck.com/sports/m-footbl/schedule/', exclude: /parking/i },
      alias: /bobby dodd/i,
    },
    'McCamish Pavilion': {
      geo: [33.78065, -84.39276],
      capacity: 8600,
      type: 'sports',
      cssVar: '--v-mccamish',
      color: '#86eac4',
      url: 'https://ramblinwreck.com/sports/m-baskbl/schedule/',
      icon: 'https://www.google.com/s2/favicons?domain=ramblinwreck.com&sz=128',
      tm: { id: 'KovZpZAJ7ktA', match: "mccamish", fallbackUrl: 'https://ramblinwreck.com/sports/m-baskbl/schedule/' },
      alias: /mccamish/i,
    },
    // --- Music rooms and around (`area: 'town'`): the Tabernacle and the clubs from Midtown to Little Five Points and Decatur, then the amphitheatres ---
    'Tabernacle': {
      geo: [33.75869, -84.39145],
      area: 'town',
      capacity: 2600,
      type: 'concert',
      cssVar: '--v-tabernacle',
      color: '#e186ea',
      url: 'https://www.tabernacleatl.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.tabernacleatl.com&sz=128',
      tm: { id: 'KovZpaFEZe', match: "tabernacle", fallbackUrl: 'https://www.tabernacleatl.com/' },
      alias: /tabernacle/i,
    },
    'The Eastern': {
      geo: [33.74594, -84.36099],
      area: 'town',
      capacity: 2200,
      type: 'concert',
      cssVar: '--v-eastern',
      color: '#d5ea86',
      url: 'https://www.easternatl.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.easternatl.com&sz=128',
      tm: { id: 'KovZ917AYK-', match: "the eastern", fallbackUrl: 'https://www.easternatl.com/' },
      alias: /^the eastern$/i,
    },
    'Coca-Cola Roxy': {
      geo: [33.89024, -84.46972],
      area: 'town',
      capacity: 3600,
      type: 'concert',
      cssVar: '--v-roxy',
      color: '#86b7ea',
      url: 'https://www.cocacolaroxy.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.cocacolaroxy.com&sz=128',
      tm: { id: 'KovZ917ACc7', match: "roxy", fallbackUrl: 'https://www.cocacolaroxy.com/' },
      alias: /coca-?cola roxy/i,
    },
    'Buckhead Theatre': {
      geo: [33.84023, -84.37954],
      area: 'town',
      capacity: 1800,
      type: 'concert',
      cssVar: '--v-buckhead',
      color: '#ea869a',
      url: 'https://www.thebuckheadtheatre.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.thebuckheadtheatre.com&sz=128',
      tm: { id: 'KovZpZAJAllA', match: "buckhead theatre", fallbackUrl: 'https://www.thebuckheadtheatre.com/' },
      alias: /buckhead theat/i,
    },
    'Variety Playhouse': {
      geo: [33.76352, -84.35094],
      area: 'town',
      capacity: 1000,
      type: 'concert',
      cssVar: '--v-variety',
      color: '#86ea8e',
      url: 'https://www.variety-playhouse.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.variety-playhouse.com&sz=128',
      tm: { id: 'KovZpa3Qne', match: "variety playhouse", fallbackUrl: 'https://www.variety-playhouse.com/' },
      alias: /variety playhouse/i,
    },
    'The Masquerade': {
      geo: [33.75177, -84.38968],
      area: 'town',
      capacity: 1000,
      type: 'concert',
      cssVar: '--v-masq',
      color: '#ab86ea',
      url: 'https://www.masqueradeatlanta.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.masqueradeatlanta.com&sz=128',
      tm: { id: 'KovZpa2WHe,KovZ917AOz0,KovZ917AOzm,KovZ917AmQG', match: "masquerade", fallbackUrl: 'https://www.masqueradeatlanta.com/' },
      alias: /masquerade/i,
    },
    'Center Stage': {
      geo: [33.79189, -84.38779],
      area: 'town',
      capacity: 1050,
      type: 'concert',
      cssVar: '--v-centerstage',
      color: '#eac886',
      url: 'https://www.centerstage-atlanta.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.centerstage-atlanta.com&sz=128',
      tm: { id: 'KovZpZAFF1tA', match: "center stage", fallbackUrl: 'https://www.centerstage-atlanta.com/' },
      alias: /^center stage/i,
    },
    'The Loft': {
      geo: [33.79189, -84.38779],
      area: 'town',
      capacity: 550,
      type: 'concert',
      cssVar: '--v-loft',
      color: '#86eae6',
      url: 'https://www.centerstage-atlanta.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.centerstage-atlanta.com&sz=128',
      tm: { id: 'KovZpZA1tn1A', match: "the loft", fallbackUrl: 'https://www.centerstage-atlanta.com/' },
      alias: /^the loft$/i,
    },
    'Vinyl': {
      geo: [33.79189, -84.38779],
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-vinyl',
      color: '#ea86d0',
      url: 'https://www.centerstage-atlanta.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.centerstage-atlanta.com&sz=128',
      tm: { id: 'KovZpZA1lJ7A', match: "vinyl", fallbackUrl: 'https://www.centerstage-atlanta.com/' },
      alias: /^vinyl$/i,
    },
    'Terminal West': {
      geo: [33.78254, -84.41643],
      area: 'town',
      capacity: 650,
      type: 'concert',
      cssVar: '--v-terminal',
      color: '#b3ea86',
      url: 'https://www.terminalwestatl.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.terminalwestatl.com&sz=128',
      tm: { id: 'KovZpZAJnI1A', match: "terminal west", fallbackUrl: 'https://www.terminalwestatl.com/' },
      alias: /terminal west/i,
    },
    'Believe Music Hall': {
      geo: [33.7372, -84.39371],
      area: 'town',
      capacity: 1300,
      type: 'concert',
      cssVar: '--v-believe',
      color: '#8696ea',
      url: 'https://believemusichall.com/',
      icon: 'https://www.google.com/s2/favicons?domain=believemusichall.com&sz=128',
      tm: { id: 'KovZ917AYbg', match: "believe music hall", fallbackUrl: 'https://believemusichall.com/' },
      alias: /believe music hall/i,
    },
    'Aisle 5': {
      geo: [33.76427, -84.35022],
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-aisle5',
      color: '#ea9286',
      url: 'https://www.aisle5atl.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.aisle5atl.com&sz=128',
      tm: { id: 'KovZ917ACI0', match: "aisle 5", fallbackUrl: 'https://www.aisle5atl.com/' },
      alias: /aisle 5/i,
    },
    "Smith's Olde Bar": {
      geo: [33.79759, -84.36877],
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-sob',
      color: '#86eab0',
      url: 'https://www.sobatl.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.sobatl.com&sz=128',
      tm: { id: 'KovZpZA1IlFA', match: "olde bar", fallbackUrl: 'https://www.sobatl.com/' },
      alias: /smith'?s olde bar/i,
    },
    "Eddie's Attic": {
      geo: [33.77398, -84.29627],
      area: 'town',
      capacity: 185,
      type: 'concert',
      cssVar: '--v-eddies',
      color: '#cd86ea',
      url: 'https://www.eddiesattic.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.eddiesattic.com&sz=128',
      tm: { id: 'KovZ917A8f0', match: "eddie's attic", fallbackUrl: 'https://www.eddiesattic.com/' },
      alias: /eddie'?s attic/i,
    },
    'Lakewood Amphitheatre': {
      geo: [33.70403, -84.39603],
      area: 'town',
      capacity: 19000,
      type: 'concert',
      cssVar: '--v-lakewood',
      color: '#e9ea86',
      url: 'https://www.livenation.com/venue/KovZpZAEkeFA/',
      icon: 'https://www.google.com/s2/favicons?domain=www.livenation.com&sz=128',
      tm: { id: 'KovZpZAEkeFA', match: "lakewood", fallbackUrl: 'https://www.livenation.com/venue/KovZpZAEkeFA/', exclude: /parking/i },
      alias: /lakewood amphitheat|cellairis/i,
    },
    'Ameris Bank Amphitheatre': {
      geo: [34.05442, -84.30668],
      area: 'town',
      capacity: 12000,
      type: 'concert',
      cssVar: '--v-ameris',
      color: '#86ccea',
      url: 'https://www.amerisbankamphitheatre.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.amerisbankamphitheatre.com&sz=128',
      tm: { id: 'KovZpZAFFdlA', match: "ameris", fallbackUrl: 'https://www.amerisbankamphitheatre.com/', exclude: /parking/i },
      alias: /ameris bank amphitheat/i,
    },
    'Chastain Park': {
      geo: [33.87688, -84.39722],
      area: 'town',
      capacity: 6900,
      type: 'concert',
      cssVar: '--v-chastain',
      color: '#ea86af',
      url: 'https://www.livenation.com/venue/KovZpZAEkAaA/',
      icon: 'https://www.google.com/s2/favicons?domain=www.livenation.com&sz=128',
      tm: { id: 'KovZpZAEkAaA', match: "chastain", fallbackUrl: 'https://www.livenation.com/venue/KovZpZAEkAaA/', exclude: /parking/i },
      alias: /chastain park/i,
    },
  };

  // The usual view: every room on — nothing here lists nightly bar programs
  var DEFAULT_ON = ['State Farm Arena', 'Mercedes-Benz Stadium', 'Truist Park', 'Fox Theatre', 'Atlanta Symphony Hall', 'Cobb Energy Centre', 'Gas South Arena', 'Gateway Center Arena', 'Bobby Dodd Stadium', 'McCamish Pavilion', 'Tabernacle', 'The Eastern', 'Coca-Cola Roxy', 'Buckhead Theatre', 'Variety Playhouse', 'The Masquerade', 'Center Stage', 'The Loft', 'Vinyl', 'Terminal West', 'Believe Music Hall', 'Aisle 5', "Smith's Olde Bar", "Eddie's Attic", 'Lakewood Amphitheatre', 'Ameris Bank Amphitheatre', 'Chastain Park'];
  var DEFAULT_OFF = [];
  var PREFS_KNOWN_FROM = null; // no default-off venue yet, so nothing for saved prefs to be told about

  // Event types: every event lands in exactly one, from its flags, title,
  // then venue. The rows the panel shows, in order.
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — stadium tours to club nights' },
    { key: 'sports', label: 'Sports', title: 'Hawks, Falcons, Braves, Atlanta United, Dream and Georgia Tech home games' },
    { key: 'arts', label: 'Arts & Theater', title: 'The Fox, the ASO, Cobb Energy Centre, comedy, dance' },
    { key: 'community', label: 'Community', title: 'Festivals, family days, the fairs' },
  ];
  var MOVIE_VENUE = null; // no cinema here

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 41 slots from the first build: ten base-36 digits (room to 51).
  var CODE_LENGTH = 10;
  var REGISTRY = [
    ['venue', 'State Farm Arena'], ['venue', 'Mercedes-Benz Stadium'], ['venue', 'Truist Park'], ['venue', 'Fox Theatre'], ['venue', 'Atlanta Symphony Hall'], ['venue', 'Cobb Energy Centre'], ['venue', 'Gas South Arena'], ['venue', 'Gateway Center Arena'], ['venue', 'Bobby Dodd Stadium'], ['venue', 'McCamish Pavilion'], ['venue', 'Tabernacle'], ['venue', 'The Eastern'], ['venue', 'Coca-Cola Roxy'], ['venue', 'Buckhead Theatre'], ['venue', 'Variety Playhouse'], ['venue', 'The Masquerade'], ['venue', 'Center Stage'], ['venue', 'The Loft'], ['venue', 'Vinyl'], ['venue', 'Terminal West'], ['venue', 'Believe Music Hall'], ['venue', 'Aisle 5'], ['venue', "Smith's Olde Bar"], ['venue', "Eddie's Attic"], ['venue', 'Lakewood Amphitheatre'], ['venue', 'Ameris Bank Amphitheatre'], ['venue', 'Chastain Park'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'hawks'], ['team', 'falcons'], ['team', 'braves'], ['team', 'united'], ['team', 'dream'], ['team', 'yellowjackets'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  // The words the page uses for the place
  var WORDS = {
    teamCity: 'Atlanta', // the board drops it from the clubs' names ("Atlanta Hawks" → Hawks)
    presetDefault: 'Every room — the stadiums, the arenas, the Fox, the music rooms and the amphitheatres — every team and type',
    presetNeighborhood: 'Downtown and the stadiums only',
    presetBig: 'Only the places that hold 2,000 or more — the stadiums, the arenas, the Fox and the amphitheatres',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing downtown and the stadiums only.', big: 'Showing the big rooms only — the stadiums, the arenas, the Fox and the amphitheatres.' },
  };

  global.LQACity = {
    key: 'atlanta',
    name: 'Atlanta',
    site: 'https://atlanta.here.events/',
    userAgent: 'Mozilla/5.0 (compatible; atlanta-events/1.0; +https://atlanta.here.events/)',
    tz: 'America/New_York', tzName: 'Eastern', // the city's time zone: the ICS feed's TZID, the game clocks, the poster's footer
    state: "Georgia", stateOutline: 'M5.6 19.3L5.3 18.0L5.4 16.5L5.1 15.9L5.4 14.7L5.5 14.3L5.9 13.9L5.7 13.6L5.7 13.2L5.0 11.5L4.9 10.8L4.7 9.7L4.5 8.6L4.3 7.5L4.1 6.4L3.9 5.3L3.7 4.2L3.5 3.1L3.3 2.0L5.7 2.0L8.1 2.1L10.3 2.0L12.5 2.0L12.3 2.3L11.6 3.3L12.3 3.7L13.0 4.3L13.5 4.4L13.6 4.7L14.4 6.2L15.6 7.4L16.5 8.4L16.8 9.0L17.1 9.2L17.4 9.8L18.1 10.3L18.6 11.8L19.1 12.6L19.7 13.8L19.9 14.5L20.5 15.2L19.9 15.4L19.9 15.7L20.0 15.9L19.6 16.1L19.5 16.4L19.6 16.6L19.3 17.0L19.5 17.0L19.4 17.2L19.1 17.7L18.8 17.8L19.2 18.1L18.7 18.5L18.5 18.7L18.5 19.2L18.3 19.8L18.4 20.4L17.0 20.1L16.7 20.1L16.5 20.2L16.4 20.8L16.4 21.5L16.1 22.0L15.8 21.9L15.8 21.5L15.7 21.2L14.5 21.1L13.4 21.0L12.2 20.9L11.0 20.8L9.9 20.8L8.7 20.7L7.5 20.6L6.4 20.5L6.0 20.3L5.6 19.3Z', // the masthead's small state, linking to here.events (scripts/state-outline.mjs, Natural Earth 1:50m)
    // the calendar feed's header; the UID domain never changes (changing it
    // re-creates every event in subscribers' calendars)
    ics: { name: 'Atlanta Events', short: 'Atlanta Events', teams: 'Atlanta home teams — every season', prodid: '-//here.events//atlanta-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events around Atlanta\\, GA — State Farm Arena\\, Mercedes-Benz Stadium\\, Truist Park\\, the Fox Theatre and the music rooms' },
    teams: TEAMS,
    map: { // the Map view (local-map.js; the ground drawn once by scripts/build-local-map.mjs from OpenStreetMap, committed as site/local-map.json) — every city gets one, Steve, 2026-10-26
      kind: 'urban',
      bbox: [33.584, -84.527, 34.116, -84.034], // south, west, north, east — every room, with a margin
      home: [33.584, -84.489, 33.951, -84.364], // the view at first: the city's own rooms; the fit button shows the whole frame
      roads: ['motorway', 'trunk', 'primary'],
      tolerance: 0.8,
      labels: [
        { name: 'Atlanta', lat: 33.749, lon: -84.388, anchor: 'middle' },
        { name: 'Duluth', lat: 34.00286, lon: -84.1441, anchor: 'middle' },
        { name: 'College Park', lat: 33.65344, lon: -84.44937, anchor: 'middle' },
        { name: 'Decatur', lat: 33.77376, lon: -84.29607, anchor: 'middle' },
        { name: 'Alpharetta', lat: 34.0756, lon: -84.2946, anchor: 'middle' },
      ],
    },
    venues: VENUES,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: null, // every listing is read by room, so nothing arrives under a name city.js lacks
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
