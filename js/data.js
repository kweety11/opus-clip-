/* ============================================================
   FILM TREND — demo catalogue
   Each shot carries the same metadata the real search indexes:
   shot size, camera angle, camera movement, time of day,
   dominant colour and free-text keywords.
   ============================================================ */

const MOVIES = [
  // src: Film | Commercial | Music Video
  { slug: "neon-runner",       title: "Neon Runner",         year: 2017, director: "D. Vellano",   dp: "R. Deakins Jr.", genre: "Sci-Fi",   country: "USA",         palette: ["#0d1b2a", "#e07b39", "#3fc1c0"], src: "Film" },
  { slug: "the-basement",      title: "The Basement",        year: 2019, director: "B. Joon",      dp: "H. Kyung",       genre: "Thriller", country: "South Korea", palette: ["#1b2620", "#5d7052", "#b7c4a8"], src: "Film" },
  { slug: "night-drive",       title: "Night Drive",         year: 2011, director: "N. Refnson",   dp: "N. Sigel",       genre: "Crime",    country: "USA",         palette: ["#120a1e", "#e152a0", "#5d3fd3"], src: "Film" },
  { slug: "city-of-stars",     title: "City of Stars",       year: 2016, director: "D. Chazon",    dp: "L. Sandgren",    genre: "Musical",  country: "USA",         palette: ["#1a1440", "#c94b8c", "#f2a33c"], src: "Film" },
  { slug: "fury-desert",       title: "Fury Desert",         year: 2015, director: "G. Milner",    dp: "J. Seale",       genre: "Action",   country: "Australia",   palette: ["#7a2f0e", "#e8842c", "#1f6f8b"], src: "Film" },
  { slug: "grand-hotel-pink",  title: "Grand Hotel Pink",    year: 2014, director: "W. Andersen",  dp: "R. Yeoman",      genre: "Comedy",   country: "Germany",     palette: ["#c76b98", "#f2c1d1", "#5a3d5c"], src: "Film" },
  { slug: "her-voice",         title: "Her Voice",           year: 2013, director: "S. Jonzy",     dp: "H. van Hoytema", genre: "Romance",  country: "USA",         palette: ["#b33a3a", "#e8987a", "#f5e0c8"], src: "Film" },
  { slug: "sand-planet",       title: "Sand Planet",         year: 2021, director: "D. Vellano",   dp: "G. Fraser",      genre: "Sci-Fi",   country: "USA",         palette: ["#8a6d4b", "#c9a876", "#2f3640"], src: "Film" },
  { slug: "mood-for-rain",     title: "Mood for Rain",       year: 2000, director: "W. Kar-Wei",   dp: "C. Doyle",       genre: "Romance",  country: "Hong Kong",   palette: ["#5c1a1a", "#8f2d2d", "#25403b"], src: "Film" },
  { slug: "blue-moonlight",    title: "Blue Moonlight",      year: 2016, director: "B. Jenkinson", dp: "J. Laxton",      genre: "Drama",    country: "USA",         palette: ["#0e1b3a", "#2c4a8a", "#7a5ba6"], src: "Film" },
  { slug: "one-long-night",    title: "One Long Night",      year: 2019, director: "S. Mendel",    dp: "R. Deakins Jr.", genre: "War",      country: "UK",          palette: ["#241a0e", "#e8842c", "#3d4a2f"], src: "Film" },
  { slug: "montmartre-dream",  title: "Montmartre Dream",    year: 2001, director: "J-P. Jeune",   dp: "B. Delbonnel",   genre: "Comedy",   country: "France",      palette: ["#3a5c34", "#c93b2c", "#e8b04b"], src: "Film" },
  { slug: "gravity-parfum",    title: "Gravity — Parfum No.9", year: 2023, director: "M. Solane",  dp: "K. Arledge",     genre: "Luxury",   country: "France",      palette: ["#141420", "#b9a06a", "#e8dcc0"], src: "Commercial" },
  { slug: "run-the-city",      title: "Run the City — Sportswear", year: 2024, director: "T. Okafor", dp: "S. Meier",    genre: "Sport",    country: "UK",          palette: ["#0f1a2a", "#e04a3a", "#3fc1c0"], src: "Commercial" },
  { slug: "midnight-frequency",title: "Midnight Frequency",  year: 2022, director: "A. Volkova",   dp: "P. Nyström",     genre: "Electronic", country: "Ukraine",   palette: ["#160a24", "#c93bdf", "#38c9b9"], src: "Music Video" },
  { slug: "golden-hour-anthem",title: "Golden Hour Anthem",  year: 2025, director: "L. Marchetti", dp: "D. Costa",       genre: "Indie Pop", country: "Italy",     palette: ["#2a1a0e", "#e8952c", "#f2d5a0"], src: "Music Video" },
];

/* comp types: horizon | neon | corridor | window | road | rain | closeup | symmetry */
const SHOTS = [
  // Neon Runner
  { id: 1,  movie: "neon-runner", title: "Hologram over the dead city",  comp: "neon",     size: "Wide",         angle: "Low",       move: "Dolly",    tod: "Night", color: "teal",   kw: "hologram neon cyberpunk city rain futuristic" },
  { id: 2,  movie: "neon-runner", title: "Orange dust exile",            comp: "horizon",  size: "Extreme Wide", angle: "Eye Level", move: "Static",   tod: "Day",   color: "amber",  kw: "desert orange fog ruins lone figure dust" },
  { id: 3,  movie: "neon-runner", title: "Interrogation glass room",     comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Interior", color: "teal", kw: "glass room silhouette interrogation minimal" },
  { id: 4,  movie: "neon-runner", title: "Spinner descends in rain",     comp: "rain",     size: "Wide",         angle: "High",      move: "Crane",    tod: "Night", color: "blue",   kw: "flying car rain neon descent aerial" },

  // The Basement
  { id: 5,  movie: "the-basement", title: "Half-basement window view",   comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Day",   color: "green",  kw: "basement window street level poverty frame" },
  { id: 6,  movie: "the-basement", title: "Garden party from above",     comp: "symmetry", size: "Wide",         angle: "Overhead",  move: "Static",   tod: "Day",   color: "green",  kw: "garden lawn party wealth overhead geometry" },
  { id: 7,  movie: "the-basement", title: "Flooded staircase escape",    comp: "corridor", size: "Wide",         angle: "High",      move: "Handheld", tod: "Night", color: "mono",   kw: "stairs flood rain escape descent city" },
  { id: 8,  movie: "the-basement", title: "Morse code lamp",             comp: "closeup",  size: "Close-Up",     angle: "Low",       move: "Static",   tod: "Night", color: "amber",  kw: "lamp flicker morse code light bulb signal" },

  // Night Drive
  { id: 9,  movie: "night-drive", title: "Scorpion jacket in elevator",  comp: "corridor", size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Interior", color: "pink", kw: "elevator kiss neon jacket tension slow motion" },
  { id: 10, movie: "night-drive", title: "LA river at 2AM",              comp: "road",     size: "Wide",         angle: "Low",       move: "Tracking", tod: "Night", color: "purple", kw: "car chase los angeles night headlights river" },
  { id: 11, movie: "night-drive", title: "Pink title over skyline",      comp: "neon",     size: "Extreme Wide", angle: "High",      move: "Pan",      tod: "Night", color: "pink",   kw: "skyline pink titles synthwave aerial city" },
  { id: 12, movie: "night-drive", title: "Driver waits, engine off",     comp: "closeup",  size: "Close-Up",     angle: "Eye Level", move: "Static",   tod: "Night", color: "purple", kw: "driver profile watch waiting car interior" },

  // City of Stars
  { id: 13, movie: "city-of-stars", title: "Dance at magic hour",        comp: "horizon",  size: "Wide",         angle: "Eye Level", move: "Dolly",    tod: "Dusk",  color: "pink",   kw: "dance couple sunset hill purple magic hour" },
  { id: 14, movie: "city-of-stars", title: "Planetarium waltz",          comp: "closeup",  size: "Medium",       angle: "Low",       move: "Crane",    tod: "Night", color: "blue",   kw: "stars planetarium float dance dream" },
  { id: 15, movie: "city-of-stars", title: "Freeway musical number",     comp: "road",     size: "Extreme Wide", angle: "High",      move: "Crane",    tod: "Day",   color: "amber",  kw: "freeway traffic musical crowd choreography opening" },
  { id: 16, movie: "city-of-stars", title: "Audition spotlight",         comp: "window",   size: "Close-Up",     angle: "Eye Level", move: "Zoom",     tod: "Interior", color: "blue", kw: "audition spotlight face song emotion" },

  // Fury Desert
  { id: 17, movie: "fury-desert", title: "War rig through the storm",    comp: "horizon",  size: "Extreme Wide", angle: "Low",       move: "Tracking", tod: "Day",   color: "amber",  kw: "sandstorm truck convoy chase apocalypse" },
  { id: 18, movie: "fury-desert", title: "Night swamp crossing",         comp: "rain",     size: "Wide",         angle: "Eye Level", move: "Dolly",    tod: "Night", color: "teal",   kw: "swamp night blue crossing silhouettes stilts" },
  { id: 19, movie: "fury-desert", title: "Flare gun to the sky",         comp: "closeup",  size: "Medium",       angle: "Low",       move: "Handheld", tod: "Dusk",  color: "red",    kw: "flare signal sky desperate sky red" },
  { id: 20, movie: "fury-desert", title: "Canyon ambush pass",           comp: "corridor", size: "Wide",         angle: "High",      move: "Pan",      tod: "Day",   color: "amber",  kw: "canyon rocks ambush motorcycles pass" },

  // Grand Hotel Pink
  { id: 21, movie: "grand-hotel-pink", title: "Facade in fresh snow",    comp: "symmetry", size: "Extreme Wide", angle: "Eye Level", move: "Static",   tod: "Day",   color: "pink",   kw: "hotel facade symmetry pastel snow miniature" },
  { id: 22, movie: "grand-hotel-pink", title: "Lobby boy at his post",   comp: "corridor", size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Interior", color: "red", kw: "lobby uniform centered deadpan portrait" },
  { id: 23, movie: "grand-hotel-pink", title: "Funicular ascent",        comp: "road",     size: "Wide",         angle: "Low",       move: "Tilt",     tod: "Dusk",  color: "purple", kw: "funicular mountain cable car pastel ascent" },
  { id: 24, movie: "grand-hotel-pink", title: "Courtesan au chocolat",   comp: "closeup",  size: "Close-Up",     angle: "Overhead",  move: "Static",   tod: "Interior", color: "pink", kw: "pastry box dessert pink overhead insert" },

  // Her Voice
  { id: 25, movie: "her-voice", title: "Red shirt in the crowd",         comp: "closeup",  size: "Medium",       angle: "Eye Level", move: "Handheld", tod: "Day",   color: "red",    kw: "crowd station red shirt loneliness soft" },
  { id: 26, movie: "her-voice", title: "Letter writer at dawn",          comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Dawn",  color: "amber",  kw: "office desk dawn warm letters melancholy" },
  { id: 27, movie: "her-voice", title: "Rooftop city haze",              comp: "horizon",  size: "Wide",         angle: "High",      move: "Pan",      tod: "Dusk",  color: "amber",  kw: "rooftop skyline haze future soft pastel" },
  { id: 28, movie: "her-voice", title: "Beach in winter light",          comp: "horizon",  size: "Extreme Wide", angle: "Eye Level", move: "Static",   tod: "Day",   color: "mono",   kw: "beach winter pale sand two figures quiet" },

  // Sand Planet
  { id: 29, movie: "sand-planet", title: "Ornithopter over dunes",       comp: "horizon",  size: "Extreme Wide", angle: "High",      move: "Crane",    tod: "Day",   color: "amber",  kw: "dunes aircraft shadow scale epic sand" },
  { id: 30, movie: "sand-planet", title: "Throne room shadows",          comp: "corridor", size: "Wide",         angle: "Low",       move: "Dolly",    tod: "Interior", color: "mono", kw: "brutalist hall shadow figures power" },
  { id: 31, movie: "sand-planet", title: "Eclipse over the arena",       comp: "closeup",  size: "Wide",         angle: "Low",       move: "Static",   tod: "Dusk",  color: "mono",   kw: "eclipse arena crowd black sun ritual" },
  { id: 32, movie: "sand-planet", title: "Sietch water ceremony",        comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Interior", color: "blue", kw: "cave pool ritual reflection blue ceremony" },

  // Mood for Rain
  { id: 33, movie: "mood-for-rain", title: "Noodle stand pass-by",       comp: "corridor", size: "Medium",       angle: "Eye Level", move: "Tracking", tod: "Night", color: "red",    kw: "alley slow motion pass longing cheongsam" },
  { id: 34, movie: "mood-for-rain", title: "Red curtain hallway",        comp: "corridor", size: "Wide",         angle: "Eye Level", move: "Dolly",    tod: "Interior", color: "red", kw: "curtains red hallway hotel secret" },
  { id: 35, movie: "mood-for-rain", title: "Rain on the taxi window",    comp: "rain",     size: "Close-Up",     angle: "Eye Level", move: "Static",   tod: "Night", color: "green",  kw: "taxi rain window reflection tears neon" },
  { id: 36, movie: "mood-for-rain", title: "Whisper into the wall",      comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Day",   color: "green",  kw: "temple wall secret whisper ruins" },

  // Blue Moonlight
  { id: 37, movie: "blue-moonlight", title: "Swim lesson at dusk",       comp: "horizon",  size: "Medium",       angle: "Eye Level", move: "Handheld", tod: "Dusk",  color: "blue",   kw: "ocean swim lesson baptism waves tender" },
  { id: 38, movie: "blue-moonlight", title: "Moonlit beach talk",        comp: "horizon",  size: "Wide",         angle: "Eye Level", move: "Static",   tod: "Night", color: "blue",   kw: "beach moonlight two boys sand night" },
  { id: 39, movie: "blue-moonlight", title: "Diner reunion",             comp: "window",   size: "Medium",       angle: "Eye Level", move: "Static",   tod: "Night", color: "purple", kw: "diner reunion jukebox warm gaze" },
  { id: 40, movie: "blue-moonlight", title: "Streetlight circling",      comp: "neon",     size: "Medium",       angle: "Eye Level", move: "Pan",      tod: "Night", color: "purple", kw: "circle camera fight schoolyard streetlight" },

  // One Long Night
  { id: 41, movie: "one-long-night", title: "Flare over the ruins",      comp: "neon",     size: "Wide",         angle: "Low",       move: "Tracking", tod: "Night", color: "amber",  kw: "flares ruins church fire shadows run" },
  { id: 42, movie: "one-long-night", title: "Through no man's land",     comp: "horizon",  size: "Extreme Wide", angle: "Eye Level", move: "Tracking", tod: "Day",   color: "green",  kw: "trench mud craters continuous one shot" },
  { id: 43, movie: "one-long-night", title: "River of petals",           comp: "rain",     size: "Medium",       angle: "High",      move: "Static",   tod: "Day",   color: "mono",   kw: "river petals float exhausted current" },
  { id: 44, movie: "one-long-night", title: "The last sprint",           comp: "road",     size: "Wide",         angle: "Eye Level", move: "Tracking", tod: "Dawn",  color: "green",  kw: "run trench sprint explosion charge field" },

  // Montmartre Dream
  { id: 45, movie: "montmartre-dream", title: "Skipping stones canal",   comp: "horizon",  size: "Wide",         angle: "Eye Level", move: "Pan",      tod: "Day",   color: "green",  kw: "canal stones ripples whimsy paris" },
  { id: 46, movie: "montmartre-dream", title: "Café of little pleasures",comp: "window",   size: "Medium",       angle: "Eye Level", move: "Dolly",    tod: "Interior", color: "red", kw: "cafe waitress warm red curious paris" },
  { id: 47, movie: "montmartre-dream", title: "Photo booth mystery",     comp: "closeup",  size: "Close-Up",     angle: "Eye Level", move: "Zoom",     tod: "Interior", color: "amber", kw: "photo booth strips mystery station" },
  { id: 48, movie: "montmartre-dream", title: "Rooftops of Montmartre",  comp: "symmetry", size: "Extreme Wide", angle: "High",      move: "Crane",    tod: "Dusk",  color: "green",  kw: "rooftops paris sunset chimneys postcard" },

  // Gravity — Parfum No.9 (commercial)
  { id: 49, movie: "gravity-parfum", title: "Bottle in zero gravity",    comp: "closeup",  size: "Close-Up",     angle: "Eye Level", move: "Dolly",    tod: "Interior", color: "amber", kw: "perfume bottle float luxury gold macro product" },
  { id: 50, movie: "gravity-parfum", title: "Silk dress falling upward", comp: "window",   size: "Wide",         angle: "Low",       move: "Crane",    tod: "Interior", color: "mono",  kw: "silk slow motion model levitate elegant studio" },

  // Run the City — Sportswear (commercial)
  { id: 51, movie: "run-the-city", title: "Sprint through traffic",      comp: "road",     size: "Wide",         angle: "Low",       move: "Tracking", tod: "Night", color: "red",    kw: "runner sprint city night energy sneakers urban" },
  { id: 52, movie: "run-the-city", title: "Rooftop leap at dawn",        comp: "horizon",  size: "Extreme Wide", angle: "High",      move: "Crane",    tod: "Dawn",  color: "teal",   kw: "parkour rooftop jump dawn skyline athlete" },

  // Midnight Frequency (music video)
  { id: 53, movie: "midnight-frequency", title: "Strobe tunnel chorus",  comp: "corridor", size: "Medium",       angle: "Eye Level", move: "Dolly",    tod: "Night", color: "purple", kw: "strobe tunnel dance chorus lights rave" },
  { id: 54, movie: "midnight-frequency", title: "Neon rain performance", comp: "rain",     size: "Medium",       angle: "Low",       move: "Handheld", tod: "Night", color: "pink",   kw: "singer rain neon performance wet glow" },

  // Golden Hour Anthem (music video)
  { id: 55, movie: "golden-hour-anthem", title: "Field of backlit dust", comp: "horizon",  size: "Wide",         angle: "Eye Level", move: "Static",   tod: "Dusk",  color: "amber",  kw: "field golden hour dust backlight band warm" },
  { id: 56, movie: "golden-hour-anthem", title: "Vinyl spin macro",      comp: "closeup",  size: "Close-Up",     angle: "Overhead",  move: "Zoom",     tod: "Interior", color: "amber", kw: "vinyl record spin macro needle retro" },
];

const FILTER_DEFS = {
  src:   { label: "Source",          opts: ["Film", "Commercial", "Music Video"] },
  size:  { label: "Shot Size",       opts: ["Close-Up", "Medium", "Wide", "Extreme Wide"] },
  angle: { label: "Camera Angle",    opts: ["Eye Level", "Low", "High", "Overhead"] },
  move:  { label: "Camera Movement", opts: ["Static", "Pan", "Tilt", "Dolly", "Tracking", "Crane", "Handheld", "Zoom"] },
  tod:   { label: "Time of Day",     opts: ["Day", "Night", "Dusk", "Dawn", "Interior"] },
};

const COLOR_DEFS = {
  amber:  "#e8952c",
  red:    "#c93b2e",
  pink:   "#df5fa4",
  purple: "#7a4fd3",
  blue:   "#2f6bd8",
  teal:   "#2cb5a8",
  green:  "#4d8a3d",
  mono:   "#9aa0ae",
};

const POSTS = [
  { slug: "shot-reference-workflow", date: "Jun 12, 2026", title: "Building a director's treatment 10× faster", excerpt: "How top directors use shot reference search to assemble mood boards and animatics in hours, not weeks.", palette: ["#1a1440", "#c94b8c", "#f2a33c"] },
  { slug: "color-harmony-guide",     date: "May 28, 2026", title: "Color harmony: a cinematographer's cheat sheet", excerpt: "Complementary, analogous, triadic — what each palette says on screen and how to search by it.", palette: ["#5c1a1a", "#8f2d2d", "#25403b"] },
  { slug: "camera-movement-language",date: "May 02, 2026", title: "The hidden language of camera movement", excerpt: "Dolly, crane, handheld — what movement communicates, with iconic examples from our library.", palette: ["#0d1b2a", "#e07b39", "#3fc1c0"], src: "Film" },
];
