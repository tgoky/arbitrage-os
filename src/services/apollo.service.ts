// services/apollo.service.ts - COMPLETE GLOBAL LEAD GENERATION ENCYCLOPEDIA
import { Redis } from '@upstash/redis';
import { CreditsService } from './credits.service';

export interface LeadGenerationCriteria {
  targetIndustry: string[];
  targetRole: string[];
  companySize: string[];
  country?: string[];
  state?: string[];
  city?: string[];
  keywords?: string[];
  technologies?: string[];
  revenueRange?: {
    min?: number;
    max?: number;
  };
  leadCount: number;
  requirements?: string[];
  [key: string]: any;
}

export interface GeneratedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  companySize?: string;
  location: string;
  linkedinUrl?: string;
  website?: string;
  score: number;
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
    departments?: string[];
    seniority?: string;
    emailStatus?: string;
    countryCode?: string;
    timezone?: string;
    currency?: string;
    sourceIndustry?: string;        // Add this line
    searchStrategy?: string;        // Add this line too for completeness
  };
}


export interface LeadGenerationResponse {
  leads: GeneratedLead[];
  totalFound: number;
  tokensUsed: number;
  generationTime: number;
  apolloBatchId?: string;
  creditInfo?: any;
  fromCache?: boolean;
  searchStrategy?: string;
  globalCoverage?: {
    countries: string[];
    regions: string[];
    totalLocations: number;
     isGlobal?: boolean; 
  };
}

// GLOBAL LOCATION ENCYCLOPEDIA - 195+ Countries
const GLOBAL_LOCATIONS = {
  // AFRICA (54 countries)
  africa: {
    'algeria': ['Algeria', 'Algiers, Algeria', 'Oran, Algeria', 'Constantine, Algeria'],
    'angola': ['Angola', 'Luanda, Angola', 'Huambo, Angola', 'Lobito, Angola'],
    'benin': ['Benin', 'Cotonou, Benin', 'Porto-Novo, Benin', 'Parakou, Benin'],
    'botswana': ['Botswana', 'Gaborone, Botswana', 'Francistown, Botswana'],
    'burkina faso': ['Burkina Faso', 'Ouagadougou, Burkina Faso', 'Bobo-Dioulasso, Burkina Faso'],
    'burundi': ['Burundi', 'Bujumbura, Burundi', 'Gitega, Burundi'],
    'cabo verde': ['Cabo Verde', 'Praia, Cabo Verde', 'Mindelo, Cabo Verde'],
    'cameroon': ['Cameroon', 'Yaoundé, Cameroon', 'Douala, Cameroon', 'Bamenda, Cameroon'],
    'central african republic': ['Central African Republic', 'Bangui, Central African Republic'],
    'chad': ['Chad', 'N\'Djamena, Chad', 'Moundou, Chad'],
    'comoros': ['Comoros', 'Moroni, Comoros'],
    'congo': ['Congo', 'Brazzaville, Congo', 'Pointe-Noire, Congo'],
    'democratic republic of congo': ['Democratic Republic of Congo', 'Kinshasa, DRC', 'Lubumbashi, DRC'],
    'djibouti': ['Djibouti', 'Djibouti City, Djibouti'],
    'egypt': ['Egypt', 'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt', 'Sharm El Sheikh, Egypt'],
    'equatorial guinea': ['Equatorial Guinea', 'Malabo, Equatorial Guinea'],
    'eritrea': ['Eritrea', 'Asmara, Eritrea'],
    'eswatini': ['Eswatini', 'Mbabane, Eswatini', 'Manzini, Eswatini'],
    'ethiopia': ['Ethiopia', 'Addis Ababa, Ethiopia', 'Dire Dawa, Ethiopia', 'Mekelle, Ethiopia'],
    'gabon': ['Gabon', 'Libreville, Gabon', 'Port-Gentil, Gabon'],
    'gambia': ['Gambia', 'Banjul, Gambia', 'Serekunda, Gambia'],
    'ghana': ['Ghana', 'Accra, Ghana', 'Kumasi, Ghana', 'Tamale, Ghana', 'Cape Coast, Ghana'],
    'guinea': ['Guinea', 'Conakry, Guinea', 'Nzérékoré, Guinea'],
    'guinea bissau': ['Guinea-Bissau', 'Bissau, Guinea-Bissau'],
    'ivory coast': ['Ivory Coast', 'Abidjan, Ivory Coast', 'Yamoussoukro, Ivory Coast', 'Bouaké, Ivory Coast'],
    'kenya': ['Kenya', 'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya'],
    'lesotho': ['Lesotho', 'Maseru, Lesotho'],
    'liberia': ['Liberia', 'Monrovia, Liberia'],
    'libya': ['Libya', 'Tripoli, Libya', 'Benghazi, Libya', 'Misrata, Libya'],
    'madagascar': ['Madagascar', 'Antananarivo, Madagascar', 'Toamasina, Madagascar'],
    'malawi': ['Malawi', 'Lilongwe, Malawi', 'Blantyre, Malawi'],
    'mali': ['Mali', 'Bamako, Mali', 'Sikasso, Mali'],
    'mauritania': ['Mauritania', 'Nouakchott, Mauritania'],
    'mauritius': ['Mauritius', 'Port Louis, Mauritius', 'Beau Bassin-Rose Hill, Mauritius'],
    'morocco': ['Morocco', 'Casablanca, Morocco', 'Rabat, Morocco', 'Fez, Morocco', 'Marrakech, Morocco'],
    'mozambique': ['Mozambique', 'Maputo, Mozambique', 'Matola, Mozambique', 'Beira, Mozambique'],
    'namibia': ['Namibia', 'Windhoek, Namibia', 'Rundu, Namibia'],
    'niger': ['Niger', 'Niamey, Niger', 'Zinder, Niger'],
    'nigeria': ['Nigeria', 'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Ibadan, Nigeria', 'Port Harcourt, Nigeria'],
    'rwanda': ['Rwanda', 'Kigali, Rwanda', 'Butare, Rwanda'],
    'sao tome and principe': ['São Tomé and Príncipe', 'São Tomé, São Tomé and Príncipe'],
    'senegal': ['Senegal', 'Dakar, Senegal', 'Thiès, Senegal', 'Kaolack, Senegal'],
    'seychelles': ['Seychelles', 'Victoria, Seychelles'],
    'sierra leone': ['Sierra Leone', 'Freetown, Sierra Leone', 'Bo, Sierra Leone'],
    'somalia': ['Somalia', 'Mogadishu, Somalia', 'Hargeisa, Somalia'],
    'south africa': ['South Africa', 'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa', 'Pretoria, South Africa'],
    'south sudan': ['South Sudan', 'Juba, South Sudan'],
    'sudan': ['Sudan', 'Khartoum, Sudan', 'Omdurman, Sudan'],
    'tanzania': ['Tanzania', 'Dar es Salaam, Tanzania', 'Dodoma, Tanzania', 'Mwanza, Tanzania'],
    'togo': ['Togo', 'Lomé, Togo', 'Sokodé, Togo'],
    'tunisia': ['Tunisia', 'Tunis, Tunisia', 'Sfax, Tunisia', 'Sousse, Tunisia'],
    'uganda': ['Uganda', 'Kampala, Uganda', 'Gulu, Uganda', 'Lira, Uganda'],
    'zambia': ['Zambia', 'Lusaka, Zambia', 'Kitwe, Zambia', 'Ndola, Zambia'],
    'zimbabwe': ['Zimbabwe', 'Harare, Zimbabwe', 'Bulawayo, Zimbabwe', 'Chitungwiza, Zimbabwe']
  },

  // ASIA (48 countries)
  asia: {
    'afghanistan': ['Afghanistan', 'Kabul, Afghanistan', 'Kandahar, Afghanistan'],
    'armenia': ['Armenia', 'Yerevan, Armenia', 'Gyumri, Armenia'],
    'azerbaijan': ['Azerbaijan', 'Baku, Azerbaijan', 'Ganja, Azerbaijan'],
    'bahrain': ['Bahrain', 'Manama, Bahrain', 'Riffa, Bahrain'],
    'bangladesh': ['Bangladesh', 'Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Khulna, Bangladesh'],
    'bhutan': ['Bhutan', 'Thimphu, Bhutan', 'Phuntsholing, Bhutan'],
    'brunei': ['Brunei', 'Bandar Seri Begawan, Brunei'],
    'cambodia': ['Cambodia', 'Phnom Penh, Cambodia', 'Siem Reap, Cambodia'],
    'china': ['China', 'Beijing, China', 'Shanghai, China', 'Shenzhen, China', 'Guangzhou, China', 'Hangzhou, China'],
    'cyprus': ['Cyprus', 'Nicosia, Cyprus', 'Limassol, Cyprus'],
    'georgia': ['Georgia', 'Tbilisi, Georgia', 'Batumi, Georgia'],
    'india': ['India', 'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India', 'Hyderabad, India', 'Pune, India'],
    'indonesia': ['Indonesia', 'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Bandung, Indonesia', 'Medan, Indonesia'],
    'iran': ['Iran', 'Tehran, Iran', 'Mashhad, Iran', 'Isfahan, Iran'],
    'iraq': ['Iraq', 'Baghdad, Iraq', 'Basra, Iraq', 'Erbil, Iraq'],
    'israel': ['Israel', 'Tel Aviv, Israel', 'Jerusalem, Israel', 'Haifa, Israel'],
    'japan': ['Japan', 'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan', 'Nagoya, Japan'],
    'jordan': ['Jordan', 'Amman, Jordan', 'Zarqa, Jordan', 'Irbid, Jordan'],
    'kazakhstan': ['Kazakhstan', 'Almaty, Kazakhstan', 'Nur-Sultan, Kazakhstan', 'Shymkent, Kazakhstan'],
    'kuwait': ['Kuwait', 'Kuwait City, Kuwait', 'Hawalli, Kuwait'],
    'kyrgyzstan': ['Kyrgyzstan', 'Bishkek, Kyrgyzstan', 'Osh, Kyrgyzstan'],
    'laos': ['Laos', 'Vientiane, Laos', 'Pakse, Laos'],
    'lebanon': ['Lebanon', 'Beirut, Lebanon', 'Tripoli, Lebanon'],
    'malaysia': ['Malaysia', 'Kuala Lumpur, Malaysia', 'George Town, Malaysia', 'Ipoh, Malaysia', 'Johor Bahru, Malaysia'],
    'maldives': ['Maldives', 'Malé, Maldives'],
    'mongolia': ['Mongolia', 'Ulaanbaatar, Mongolia', 'Erdenet, Mongolia'],
    'myanmar': ['Myanmar', 'Yangon, Myanmar', 'Mandalay, Myanmar', 'Naypyidaw, Myanmar'],
    'nepal': ['Nepal', 'Kathmandu, Nepal', 'Pokhara, Nepal'],
    'north korea': ['North Korea', 'Pyongyang, North Korea'],
    'oman': ['Oman', 'Muscat, Oman', 'Salalah, Oman'],
    'pakistan': ['Pakistan', 'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Faisalabad, Pakistan'],
    'palestine': ['Palestine', 'Gaza, Palestine', 'Ramallah, Palestine'],
    'philippines': ['Philippines', 'Manila, Philippines', 'Quezon City, Philippines', 'Cebu City, Philippines', 'Davao, Philippines'],
    'qatar': ['Qatar', 'Doha, Qatar', 'Al Rayyan, Qatar'],
    'saudi arabia': ['Saudi Arabia', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Mecca, Saudi Arabia', 'Medina, Saudi Arabia'],
    'singapore': ['Singapore', 'Singapore City, Singapore'],
    'south korea': ['South Korea', 'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea'],
    'sri lanka': ['Sri Lanka', 'Colombo, Sri Lanka', 'Kandy, Sri Lanka', 'Galle, Sri Lanka'],
    'syria': ['Syria', 'Damascus, Syria', 'Aleppo, Syria', 'Homs, Syria'],
    'tajikistan': ['Tajikistan', 'Dushanbe, Tajikistan', 'Khujand, Tajikistan'],
    'thailand': ['Thailand', 'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand', 'Pattaya, Thailand'],
    'timor leste': ['Timor-Leste', 'Dili, Timor-Leste'],
    'turkey': ['Turkey', 'Istanbul, Turkey', 'Ankara, Turkey', 'Izmir, Turkey', 'Bursa, Turkey'],
    'turkmenistan': ['Turkmenistan', 'Ashgabat, Turkmenistan'],
    'uae': ['UAE', 'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE'],
    'uzbekistan': ['Uzbekistan', 'Tashkent, Uzbekistan', 'Samarkand, Uzbekistan'],
    'vietnam': ['Vietnam', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Da Nang, Vietnam', 'Can Tho, Vietnam'],
    'yemen': ['Yemen', 'Sanaa, Yemen', 'Aden, Yemen']
  },

  // EUROPE (44 countries)
  europe: {
    'albania': ['Albania', 'Tirana, Albania', 'Durrës, Albania'],
    'andorra': ['Andorra', 'Andorra la Vella, Andorra'],
    'austria': ['Austria', 'Vienna, Austria', 'Salzburg, Austria', 'Innsbruck, Austria'],
    'belarus': ['Belarus', 'Minsk, Belarus', 'Gomel, Belarus'],
    'belgium': ['Belgium', 'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium'],
    'bosnia and herzegovina': ['Bosnia and Herzegovina', 'Sarajevo, Bosnia and Herzegovina', 'Banja Luka, Bosnia and Herzegovina'],
    'bulgaria': ['Bulgaria', 'Sofia, Bulgaria', 'Plovdiv, Bulgaria', 'Varna, Bulgaria'],
    'croatia': ['Croatia', 'Zagreb, Croatia', 'Split, Croatia', 'Rijeka, Croatia'],
    'czech republic': ['Czech Republic', 'Prague, Czech Republic', 'Brno, Czech Republic', 'Ostrava, Czech Republic'],
    'denmark': ['Denmark', 'Copenhagen, Denmark', 'Aarhus, Denmark', 'Odense, Denmark'],
    'estonia': ['Estonia', 'Tallinn, Estonia', 'Tartu, Estonia'],
    'finland': ['Finland', 'Helsinki, Finland', 'Espoo, Finland', 'Tampere, Finland'],
    'france': ['France', 'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France'],
    'germany': ['Germany', 'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Cologne, Germany', 'Frankfurt, Germany'],
    'greece': ['Greece', 'Athens, Greece', 'Thessaloniki, Greece', 'Patras, Greece'],
    'hungary': ['Hungary', 'Budapest, Hungary', 'Debrecen, Hungary', 'Szeged, Hungary'],
    'iceland': ['Iceland', 'Reykjavik, Iceland'],
    'ireland': ['Ireland', 'Dublin, Ireland', 'Cork, Ireland', 'Limerick, Ireland'],
    'italy': ['Italy', 'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy'],
    'kosovo': ['Kosovo', 'Pristina, Kosovo'],
    'latvia': ['Latvia', 'Riga, Latvia', 'Daugavpils, Latvia'],
    'liechtenstein': ['Liechtenstein', 'Vaduz, Liechtenstein'],
    'lithuania': ['Lithuania', 'Vilnius, Lithuania', 'Kaunas, Lithuania'],
    'luxembourg': ['Luxembourg', 'Luxembourg City, Luxembourg'],
    'malta': ['Malta', 'Valletta, Malta', 'Birkirkara, Malta'],
    'moldova': ['Moldova', 'Chișinău, Moldova', 'Tiraspol, Moldova'],
    'monaco': ['Monaco', 'Monaco City, Monaco'],
    'montenegro': ['Montenegro', 'Podgorica, Montenegro', 'Nikšić, Montenegro'],
    'netherlands': ['Netherlands', 'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands'],
    'north macedonia': ['North Macedonia', 'Skopje, North Macedonia', 'Bitola, North Macedonia'],
    'norway': ['Norway', 'Oslo, Norway', 'Bergen, Norway', 'Trondheim, Norway'],
    'poland': ['Poland', 'Warsaw, Poland', 'Kraków, Poland', 'Łódź, Poland', 'Wrocław, Poland'],
    'portugal': ['Portugal', 'Lisbon, Portugal', 'Porto, Portugal', 'Braga, Portugal'],
    'romania': ['Romania', 'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Timișoara, Romania'],
    'russia': ['Russia', 'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia', 'Yekaterinburg, Russia'],
    'san marino': ['San Marino', 'San Marino City, San Marino'],
    'serbia': ['Serbia', 'Belgrade, Serbia', 'Novi Sad, Serbia', 'Niš, Serbia'],
    'slovakia': ['Slovakia', 'Bratislava, Slovakia', 'Košice, Slovakia'],
    'slovenia': ['Slovenia', 'Ljubljana, Slovenia', 'Maribor, Slovenia'],
    'spain': ['Spain', 'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Bilbao, Spain'],
    'sweden': ['Sweden', 'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden'],
    'switzerland': ['Switzerland', 'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland'],
    'ukraine': ['Ukraine', 'Kyiv, Ukraine', 'Kharkiv, Ukraine', 'Odesa, Ukraine'],
    'united kingdom': ['United Kingdom', 'London, UK', 'Birmingham, UK', 'Manchester, UK', 'Leeds, UK', 'Glasgow, UK'],
    'vatican city': ['Vatican City']
  },

  // NORTH AMERICA (23 countries)
  northAmerica: {
    'antigua and barbuda': ['Antigua and Barbuda', 'Saint John\'s, Antigua and Barbuda'],
    'bahamas': ['Bahamas', 'Nassau, Bahamas', 'Freeport, Bahamas'],
    'barbados': ['Barbados', 'Bridgetown, Barbados'],
    'belize': ['Belize', 'Belize City, Belize', 'San Ignacio, Belize'],
    'canada': ['Canada', 'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada', 'Ottawa, Canada'],
    'costa rica': ['Costa Rica', 'San José, Costa Rica', 'Cartago, Costa Rica'],
    'cuba': ['Cuba', 'Havana, Cuba', 'Santiago de Cuba, Cuba'],
    'dominica': ['Dominica', 'Roseau, Dominica'],
    'dominican republic': ['Dominican Republic', 'Santo Domingo, Dominican Republic', 'Santiago, Dominican Republic'],
    'el salvador': ['El Salvador', 'San Salvador, El Salvador', 'Santa Ana, El Salvador'],
    'grenada': ['Grenada', 'Saint George\'s, Grenada'],
    'guatemala': ['Guatemala', 'Guatemala City, Guatemala', 'Quetzaltenango, Guatemala'],
    'haiti': ['Haiti', 'Port-au-Prince, Haiti', 'Cap-Haïtien, Haiti'],
    'honduras': ['Honduras', 'Tegucigalpa, Honduras', 'San Pedro Sula, Honduras'],
    'jamaica': ['Jamaica', 'Kingston, Jamaica', 'Spanish Town, Jamaica'],
    'mexico': ['Mexico', 'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico'],
    'nicaragua': ['Nicaragua', 'Managua, Nicaragua', 'León, Nicaragua'],
    'panama': ['Panama', 'Panama City, Panama', 'San Miguelito, Panama'],
    'saint kitts and nevis': ['Saint Kitts and Nevis', 'Basseterre, Saint Kitts and Nevis'],
    'saint lucia': ['Saint Lucia', 'Castries, Saint Lucia'],
    'saint vincent and the grenadines': ['Saint Vincent and the Grenadines', 'Kingstown, Saint Vincent and the Grenadines'],
    'trinidad and tobago': ['Trinidad and Tobago', 'Port of Spain, Trinidad and Tobago'],
    'united states': ['United States', 'New York, US', 'Los Angeles, US', 'Chicago, US', 'Houston, US', 'Phoenix, US', 'Philadelphia, US', 'San Antonio, US', 'San Diego, US', 'Dallas, US', 'San Jose, US']
  },

  // SOUTH AMERICA (12 countries)
  southAmerica: {
    'argentina': ['Argentina', 'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina'],
    'bolivia': ['Bolivia', 'La Paz, Bolivia', 'Santa Cruz, Bolivia', 'Cochabamba, Bolivia'],
    'brazil': ['Brazil', 'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil', 'Fortaleza, Brazil'],
    'chile': ['Chile', 'Santiago, Chile', 'Valparaíso, Chile', 'Concepción, Chile'],
    'colombia': ['Colombia', 'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia'],
    'ecuador': ['Ecuador', 'Quito, Ecuador', 'Guayaquil, Ecuador', 'Cuenca, Ecuador'],
    'guyana': ['Guyana', 'Georgetown, Guyana'],
    'paraguay': ['Paraguay', 'Asunción, Paraguay', 'Ciudad del Este, Paraguay'],
    'peru': ['Peru', 'Lima, Peru', 'Arequipa, Peru', 'Trujillo, Peru'],
    'suriname': ['Suriname', 'Paramaribo, Suriname'],
    'uruguay': ['Uruguay', 'Montevideo, Uruguay', 'Salto, Uruguay'],
    'venezuela': ['Venezuela', 'Caracas, Venezuela', 'Maracaibo, Venezuela', 'Valencia, Venezuela']
  },

  // OCEANIA (14 countries)
  oceania: {
    'australia': ['Australia', 'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia'],
    'fiji': ['Fiji', 'Suva, Fiji', 'Nadi, Fiji'],
    'kiribati': ['Kiribati', 'Tarawa, Kiribati'],
    'marshall islands': ['Marshall Islands', 'Majuro, Marshall Islands'],
    'micronesia': ['Micronesia', 'Palikir, Micronesia'],
    'nauru': ['Nauru', 'Yaren, Nauru'],
    'new zealand': ['New Zealand', 'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand'],
    'palau': ['Palau', 'Ngerulmud, Palau'],
    'papua new guinea': ['Papua New Guinea', 'Port Moresby, Papua New Guinea'],
    'samoa': ['Samoa', 'Apia, Samoa'],
    'solomon islands': ['Solomon Islands', 'Honiara, Solomon Islands'],
    'tonga': ['Tonga', 'Nuku\'alofa, Tonga'],
    'tuvalu': ['Tuvalu', 'Funafuti, Tuvalu'],
    'vanuatu': ['Vanuatu', 'Port Vila, Vanuatu']
  }
};

// REGIONAL GROUPINGS
const REGIONAL_GROUPS = {
  'africa': Object.keys(GLOBAL_LOCATIONS.africa),
  'north africa': ['egypt', 'libya', 'tunisia', 'algeria', 'morocco', 'sudan'],
  'west africa': ['nigeria', 'ghana', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'guinea', 'benin', 'togo', 'sierra leone', 'liberia'],
  'east africa': ['kenya', 'ethiopia', 'uganda', 'tanzania', 'rwanda', 'burundi', 'eritrea', 'djibouti', 'somalia'],
  'southern africa': ['south africa', 'botswana', 'namibia', 'zambia', 'zimbabwe', 'mozambique', 'madagascar', 'mauritius'],
  'central africa': ['cameroon', 'central african republic', 'chad', 'congo', 'democratic republic of congo', 'equatorial guinea', 'gabon'],
  
  'asia': Object.keys(GLOBAL_LOCATIONS.asia),
  'southeast asia': ['singapore', 'malaysia', 'thailand', 'philippines', 'indonesia', 'vietnam', 'cambodia', 'laos', 'myanmar', 'brunei'],
  'east asia': ['china', 'japan', 'south korea', 'north korea', 'mongolia'],
  'south asia': ['india', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'bhutan', 'maldives'],
  'central asia': ['kazakhstan', 'uzbekistan', 'turkmenistan', 'kyrgyzstan', 'tajikistan'],
  'middle east': ['saudi arabia', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman', 'israel', 'jordan', 'lebanon', 'syria', 'iraq', 'iran', 'turkey'],
  
  'europe': Object.keys(GLOBAL_LOCATIONS.europe),
  'western europe': ['united kingdom', 'ireland', 'france', 'spain', 'portugal', 'netherlands', 'belgium', 'germany', 'austria', 'switzerland'],
  'northern europe': ['sweden', 'norway', 'denmark', 'finland', 'iceland'],
  'southern europe': ['italy', 'greece', 'malta', 'cyprus'],
  'eastern europe': ['russia', 'poland', 'czech republic', 'slovakia', 'hungary', 'romania', 'bulgaria', 'ukraine', 'belarus'],
  'balkans': ['serbia', 'croatia', 'bosnia and herzegovina', 'montenegro', 'albania', 'north macedonia', 'kosovo'],
  
  'north america': Object.keys(GLOBAL_LOCATIONS.northAmerica),
  'central america': ['guatemala', 'belize', 'el salvador', 'honduras', 'nicaragua', 'costa rica', 'panama'],
  'caribbean': ['cuba', 'jamaica', 'haiti', 'dominican republic', 'bahamas', 'barbados', 'trinidad and tobago'],
  
  'south america': Object.keys(GLOBAL_LOCATIONS.southAmerica),
  'oceania': Object.keys(GLOBAL_LOCATIONS.oceania)
};

// COMPREHENSIVE INDUSTRY KEYWORDS
const INDUSTRY_ENCYCLOPEDIA = {
  'Technology': [
    'tech', 'technology', 'software', 'digital', 'IT', 'information technology', 'SaaS', 'cloud', 'AI', 'artificial intelligence',
    'machine learning', 'ML', 'data science', 'analytics', 'big data', 'blockchain', 'cryptocurrency', 'fintech', 'edtech',
    'healthtech', 'biotech', 'cybersecurity', 'security', 'mobile', 'app', 'application', 'platform', 'startup', 'innovation',
    'automation', 'robotics', 'IoT', 'internet of things', 'virtual reality', 'VR', 'augmented reality', 'AR', 'quantum',
    'semiconductor', 'hardware', 'electronics', 'computing', 'internet', 'web', 'development', 'programming', 'coding'
  ],
  'Healthcare': [
    'healthcare', 'health', 'medical', 'medicine', 'hospital', 'clinic', 'pharmaceutical', 'pharma', 'biotech', 'biotechnology',
    'therapy', 'treatment', 'patient', 'doctor', 'physician', 'nurse', 'wellness', 'fitness', 'dental', 'dentistry', 'vision',
    'ophthalmology', 'mental health', 'psychology', 'psychiatry', 'telehealth', 'telemedicine', 'medtech', 'devices',
    'diagnostics', 'surgery', 'oncology', 'cardiology', 'neurology', 'pediatrics', 'geriatrics', 'rehabilitation'
  ],
  'Finance': [
    'finance', 'financial', 'bank', 'banking', 'investment', 'credit', 'loan', 'mortgage', 'capital', 'fund', 'venture',
    'equity', 'trading', 'wealth', 'asset management', 'insurance', 'fintech', 'payment', 'currency', 'accounting',
    'tax', 'audit', 'compliance', 'risk', 'derivatives', 'securities', 'portfolio', 'retirement', 'pension'
  ],
  'Manufacturing': [
    'manufacturing', 'factory', 'production', 'industrial', 'assembly', 'machinery', 'equipment', 'automotive', 'aerospace',
    'steel', 'chemical', 'plastic', 'textile', 'food processing', 'beverage', 'pharmaceutical manufacturing', 'electronics',
    'shipbuilding', 'construction equipment', 'heavy machinery', 'precision instruments', 'tools', 'metalworking'
  ],
  'Retail': [
    'retail', 'ecommerce', 'e-commerce', 'store', 'shop', 'marketplace', 'consumer', 'fashion', 'clothing', 'apparel',
    'FMCG', 'fast moving consumer goods', 'grocery', 'supermarket', 'department store', 'boutique', 'outlet',
    'consumer goods', 'merchandise', 'luxury', 'jewelry', 'cosmetics', 'beauty', 'home goods', 'furniture'
  ],
  'Energy': [
    'energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'electric', 'power', 'utility', 'nuclear',
    'coal', 'hydroelectric', 'mining', 'extraction', 'refining', 'petrochemical', 'natural gas', 'biofuel',
    'geothermal', 'battery', 'grid', 'transmission', 'distribution', 'carbon', 'sustainability'
  ],
  'Education': [
    'education', 'school', 'university', 'college', 'academy', 'learning', 'training', 'teaching', 'student',
    'academic', 'educational', 'edtech', 'curriculum', 'research', 'scholarship', 'degree', 'certification',
    'tutoring', 'coaching', 'e-learning', 'online education', 'vocational', 'professional development'
  ],
  'Real Estate': [
    'real estate', 'property', 'realty', 'housing', 'residential', 'commercial', 'construction', 'development',
    'building', 'architecture', 'leasing', 'rental', 'mortgage', 'investment property', 'land', 'infrastructure',
    'urban planning', 'facility management', 'property management', 'contracting'
  ],
  'Agriculture': [
    'agriculture', 'farming', 'farm', 'crop', 'livestock', 'agricultural', 'organic', 'sustainable farming',
    'agtech', 'food production', 'dairy', 'poultry', 'fisheries', 'aquaculture', 'forestry', 'irrigation',
    'fertilizer', 'pesticide', 'seed', 'grain', 'harvest', 'ranch', 'plantation'
  ],
  'Transportation': [
    'transportation', 'transport', 'logistics', 'shipping', 'delivery', 'freight', 'trucking', 'airline',
    'railroad', 'railway', 'maritime', 'supply chain', 'warehousing', 'distribution', 'fleet', 'cargo',
    'passenger', 'public transport', 'ride sharing', 'autonomous vehicles', 'electric vehicles'
  ],
  'Media & Entertainment': [
    'media', 'entertainment', 'broadcasting', 'television', 'TV', 'radio', 'film', 'movie', 'cinema', 'music',
    'gaming', 'video games', 'publishing', 'news', 'journalism', 'content', 'streaming', 'digital media',
    'social media', 'advertising', 'marketing', 'creative', 'sports', 'events', 'production'
  ],
  'Professional Services': [
    'consulting', 'advisory', 'legal', 'law', 'accounting', 'audit', 'marketing', 'advertising', 'public relations',
    'PR', 'human resources', 'HR', 'recruitment', 'staffing', 'talent', 'management consulting', 'strategy',
    'business services', 'outsourcing', 'call center', 'shared services', 'facilities management'
  ],
  'Food & Beverage': [
    'food', 'beverage', 'restaurant', 'dining', 'catering', 'hospitality', 'hotel', 'culinary', 'brewery',
    'winery', 'cafe', 'bar', 'fast food', 'fine dining', 'food service', 'bakery', 'confectionery',
    'processing', 'packaging', 'distribution', 'frozen food', 'organic food', 'nutrition'
  ],
  'Government': [
    'government', 'public sector', 'federal', 'state', 'municipal', 'local government', 'agency', 'department',
    'ministry', 'bureau', 'administration', 'civil service', 'military', 'defense', 'police', 'fire department',
    'emergency services', 'social services', 'public health', 'regulatory', 'policy', 'diplomacy'
  ],
  'Non-Profit': [
    'non-profit', 'nonprofit', 'NGO', 'charity', 'foundation', 'association', 'organization', 'social',
    'community', 'volunteer', 'humanitarian', 'advocacy', 'environmental', 'cultural', 'religious',
    'educational foundation', 'research institute', 'think tank', 'social impact', 'philanthropy'
  ],
  'Telecommunications': [
    'telecommunications', 'telecom', 'wireless', 'mobile', 'cellular', 'broadband', 'internet service provider',
    'ISP', 'fiber optic', 'satellite', 'network', 'infrastructure', '5G', 'connectivity', 'communication',
    'VoIP', 'cloud communications', 'unified communications'
  ]
};

// COUNTRY METADATA FOR ENHANCED TARGETING
const COUNTRY_METADATA = {
  // Business hours and timezone info for better targeting
  timezones: {
    'ghana': 'GMT+0',
    'nigeria': 'GMT+1',
    'kenya': 'GMT+3',
    'south africa': 'GMT+2',
    'india': 'GMT+5:30',
    'china': 'GMT+8',
    'japan': 'GMT+9',
    'australia': 'GMT+10',
    'united kingdom': 'GMT+0',
    'germany': 'GMT+1',
    'france': 'GMT+1',
    'united states': 'GMT-5 to GMT-8',
    'canada': 'GMT-3:30 to GMT-8',
    'brazil': 'GMT-3',
    'mexico': 'GMT-6'
  },
  
  // Common business languages
  languages: {
    'ghana': ['English'],
    'nigeria': ['English', 'Hausa', 'Yoruba', 'Igbo'],
    'kenya': ['English', 'Swahili'],
    'south africa': ['English', 'Afrikaans'],
    'india': ['English', 'Hindi'],
    'china': ['Chinese', 'Mandarin'],
    'japan': ['Japanese'],
    'germany': ['German', 'English'],
    'france': ['French', 'English'],
    'spain': ['Spanish'],
    'brazil': ['Portuguese'],
    'mexico': ['Spanish']
  },
  
  // Common TLDs for email generation
  domains: {
    'ghana': 'com.gh',
    'nigeria': 'com.ng',
    'kenya': 'co.ke',
    'south africa': 'co.za',
    'india': 'co.in',
    'china': 'com.cn',
    'japan': 'co.jp',
    'united kingdom': 'co.uk',
    'germany': 'de',
    'france': 'fr',
    'australia': 'com.au',
    'canada': 'ca',
    'brazil': 'com.br'
  },
  
  // Economic indicators for lead scoring
  economicTiers: {
    tier1: ['united states', 'united kingdom', 'germany', 'japan', 'france', 'canada', 'australia', 'netherlands', 'switzerland', 'sweden'],
    tier2: ['china', 'india', 'brazil', 'south korea', 'spain', 'italy', 'poland', 'turkey', 'mexico', 'russia'],
    tier3: ['nigeria', 'south africa', 'ghana', 'kenya', 'egypt', 'morocco', 'philippines', 'thailand', 'malaysia', 'chile'],
    emerging: ['uganda', 'rwanda', 'tanzania', 'vietnam', 'bangladesh', 'peru', 'colombia', 'romania', 'ukraine']
  }
};

export class EnhancedGlobalApolloService {
  private redis: Redis;
  private apolloApiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1';
  private creditsService: CreditsService;

  constructor() {
    this.apolloApiKey = process.env.APOLLO_API_KEY!;
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
    this.creditsService = new CreditsService();
  }

  // MAIN ENTRY POINT
  async generateAndSaveLeads(
    input: LeadGenerationCriteria, 
    userId: string, 
    workspaceId: string,
    campaignName?: string
 ): Promise<{
  leads: GeneratedLead[];
  deliverableId: string;
  tokensUsed: number;
  generationTime: number;
  creditInfo: any;
  searchStrategy?: string;
  globalCoverage?: {
    countries: string[];
    regions: string[];
    totalLocations: number;
       isGlobal?: boolean; 
  };
  totalFound?: number;
}> {
    console.log('🚀 Starting GLOBAL lead generation for user:', userId);
    
    const userCredits = await this.creditsService.getUserCredits(userId);
    const costInfo = await this.creditsService.calculateCost(
      input.leadCount, 
      userCredits.freeLeadsAvailable
    );
    
    console.log('💳 Credit check:', {
      userCredits: userCredits.credits,
      freeLeadsAvailable: userCredits.freeLeadsAvailable,
      estimatedCost: costInfo.totalCost,
      freeLeadsToUse: costInfo.freeLeadsUsed
    });
    
    if (costInfo.totalCost > userCredits.credits) {
      throw new Error(
        `Insufficient credits. Need ${costInfo.totalCost} credits, have ${userCredits.credits}. ` +
        `You can use ${userCredits.freeLeadsAvailable} free leads.`
      );
    }

    let response: LeadGenerationResponse;
    
    try {
      console.log('🔍 Generating leads via Enhanced Global Apollo API...');
      response = await this.generateLeads(input);
      
    } catch (error) {
      console.error('❌ Lead generation failed:', error);
      throw error;
    }
    
    console.log('💾 Saving to deliverables...');
    const deliverableId = await this.saveLeadGeneration(
      userId, 
      workspaceId, 
      response, 
      input, 
      campaignName
    );
    
    const actualLeadCount = response.leads.length;
    console.log(`💳 Deducting credits for ${actualLeadCount} actual leads...`);
    
    const creditInfo = await this.creditsService.deductCredits(
      userId, 
      workspaceId, 
      actualLeadCount, 
      deliverableId
    );

    console.log('✅ Global lead generation completed:', {
      leadsGenerated: actualLeadCount,
      creditsDeducted: creditInfo.creditsDeducted,
      remainingCredits: creditInfo.remainingCredits,
      globalCoverage: response.globalCoverage
    });

return {
  leads: response.leads,
  deliverableId,
  tokensUsed: creditInfo.creditsDeducted,
  generationTime: response.generationTime,
  creditInfo,
  searchStrategy: response.searchStrategy,
  globalCoverage: response.globalCoverage,
  totalFound: response.totalFound
};
  }

  // CORE GLOBAL LEAD GENERATION
  async generateLeads(criteria: LeadGenerationCriteria): Promise<LeadGenerationResponse> {
    const startTime = Date.now();
    
    // STEP 1: Enhance criteria with global intelligence
    const enhancedCriteria = this.enhanceCriteriaWithGlobalIntelligence(criteria);
    console.log('🌍 Enhanced criteria with global coverage:', enhancedCriteria.globalCoverage);
    
    // STEP 2: Check enhanced cache
    const cacheKey = this.generateGlobalCacheKey(enhancedCriteria);
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached && typeof cached === 'string') {
        console.log('✅ Found cached global results');
        const cachedResult = JSON.parse(cached);
        return {
          ...cachedResult,
          generationTime: Date.now() - startTime,
          fromCache: true
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache read failed, proceeding with fresh search:', cacheError);
    }

    // STEP 3: Execute progressive global search strategies
    const globalStrategies = [
      { name: 'Global Precision Search', fn: () => this.executeGlobalPrecisionSearch(enhancedCriteria) },
      { name: 'Regional Cluster Search', fn: () => this.executeRegionalClusterSearch(enhancedCriteria) },
      { name: 'Industry Focus Search', fn: () => this.executeIndustryFocusSearch(enhancedCriteria) },
      { name: 'Economic Tier Search', fn: () => this.executeEconomicTierSearch(enhancedCriteria) },
      { name: 'Continental Broadcast', fn: () => this.executeContinentalBroadcast(enhancedCriteria) },
      { name: 'Global Emergency Search', fn: () => this.executeGlobalEmergencySearch(enhancedCriteria) }
    ];

    let bestResult: LeadGenerationResponse | null = null;
    let lastError: Error | null = null;

    for (const [index, strategy] of globalStrategies.entries()) {
      try {
        console.log(`🎯 Strategy ${index + 1}/6: ${strategy.name}`);
        const result = await strategy.fn();
        
        if (result.leads.length > 0) {
          console.log(`✅ ${strategy.name} succeeded with ${result.leads.length} leads`);
          
          // Cache successful results
          try {
            await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
            console.log('💾 Cached global results for 1 hour');
          } catch (cacheError) {
            console.warn('⚠️ Failed to cache results:', cacheError);
          }
          
          return {
            ...result,
            generationTime: Date.now() - startTime,
            fromCache: false,
            searchStrategy: strategy.name,
            globalCoverage: enhancedCriteria.globalCoverage
          };
        } else {
          console.log(`⚠️ ${strategy.name} returned no results, trying next strategy...`);
        }
        
      } catch (error) {
        console.error(`❌ ${strategy.name} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Critical errors should stop all strategies
        if (error instanceof Error && 
           (error.message.includes('rate limit') || 
            error.message.includes('authentication') ||
            error.message.includes('401') ||
            error.message.includes('403'))) {
          throw error;
        }
        
        continue;
      }
    }
    
    // If all strategies failed
    throw lastError || new Error('All global search strategies failed to find leads');
  }

  // STEP 1: Enhance criteria with global intelligence
  
  private enhanceCriteriaWithGlobalIntelligence(criteria: LeadGenerationCriteria): any {
  const enhanced: any = { ...criteria };
  
  // ✅ FIXED: Properly combine all location inputs
  const allLocationInputs = [
    ...(criteria.country || []),
    ...(criteria.state || []),
    ...(criteria.city || [])
  ];
  
  console.log('🌍 Processing locations:', {
    countries: criteria.country?.length || 0,
    states: criteria.state?.length || 0,
    cities: criteria.city?.length || 0,
    combined: allLocationInputs.length
  });
  
  // GLOBAL LOCATION EXPANSION
  if (allLocationInputs.length > 0) {
    enhanced.expandedLocations = this.expandGlobalLocations(allLocationInputs);
    enhanced.regionalClusters = this.identifyRegionalClusters(allLocationInputs);
    enhanced.economicTiers = this.categorizeByEconomicTier(enhanced.expandedLocations);
    
    console.log('🌍 Location expansion results:', {
      original: allLocationInputs.length,
      expanded: enhanced.expandedLocations?.length || 0,
      regions: enhanced.regionalClusters?.length || 0
    });
  } else {
    // No location specified = global search
    enhanced.isGlobalSearch = true;
    enhanced.expandedLocations = this.getTopBusinessHubs();
    console.log('🌍 No locations specified - using global business hubs');
  }
  
  // INDUSTRY INTELLIGENCE
  if (criteria.targetIndustry?.length) {
    enhanced.industryKeywords = this.generateComprehensiveIndustryKeywords(criteria.targetIndustry);
    enhanced.relatedIndustries = this.findRelatedIndustries(criteria.targetIndustry);
    
    console.log('🏭 Industry processing:', {
      original: criteria.targetIndustry.length,
      keywords: enhanced.industryKeywords?.length || 0,
      related: enhanced.relatedIndustries?.length || 0
    });
  }
  
  // ROLE INTELLIGENCE
  if (criteria.targetRole?.length) {
    enhanced.expandedRoles = this.expandJobTitles(criteria.targetRole);
    enhanced.seniorityLevels = this.categorizeRoleSeniority(criteria.targetRole);
    
    console.log('👔 Role processing:', {
      original: criteria.targetRole.length,
      expanded: enhanced.expandedRoles?.length || 0
    });
  }
  
  // GLOBAL COVERAGE METADATA
  enhanced.globalCoverage = {
    countries: enhanced.expandedLocations ? this.extractCountries(enhanced.expandedLocations) : [],
    regions: enhanced.regionalClusters || [],
    totalLocations: enhanced.expandedLocations?.length || 0,
    economicTiers: enhanced.economicTiers || {},
    industries: enhanced.industryKeywords || [],
    isGlobal: enhanced.isGlobalSearch || false
  };
  
  return enhanced;
}

  // GLOBAL LOCATION EXPANSION ENGINE
private expandGlobalLocations(inputs: string[]): string[] {
  const expanded = new Set<string>();
  
  inputs.forEach(input => {
    const normalized = input.toLowerCase().trim();
    
    // Add original input
    expanded.add(input);
    
    // Check all continental databases
    Object.values(GLOBAL_LOCATIONS).forEach((continent: Record<string, string[]>) => {
      if (continent[normalized]) {
        continent[normalized].forEach(variant => expanded.add(variant));
      }
    });
    
    // Check regional groupings
    if (REGIONAL_GROUPS[normalized as keyof typeof REGIONAL_GROUPS]) {
      REGIONAL_GROUPS[normalized as keyof typeof REGIONAL_GROUPS].forEach(country => {
        Object.values(GLOBAL_LOCATIONS).forEach((continent: Record<string, string[]>) => {
          if (continent[country]) {
            continent[country].forEach(variant => expanded.add(variant));
          }
        });
      });
    }
    
    // Smart city/country parsing
    if (input.includes(',')) {
      const [city, region] = input.split(',').map(s => s.trim());
      expanded.add(region);
      expanded.add(city);
      
      // Try to find country variants
      const regionKey = region.toLowerCase();
      Object.values(GLOBAL_LOCATIONS).forEach((continent: Record<string, string[]>) => {
        if (continent[regionKey]) {
          continent[regionKey].forEach(variant => expanded.add(variant));
        }
      });
    }
    
    // Fuzzy matching for common misspellings/variants
    const fuzzyMatches = this.findFuzzyLocationMatches(normalized);
    fuzzyMatches.forEach(match => expanded.add(match));
  });
  
  return Array.from(expanded);
}

  // IDENTIFY REGIONAL CLUSTERS
  private identifyRegionalClusters(inputs: string[]): string[] {
    const clusters = new Set<string>();
    
    inputs.forEach(input => {
      const normalized = input.toLowerCase().trim();
      
      // Find which regional group this belongs to
      Object.entries(REGIONAL_GROUPS).forEach(([region, countries]) => {
        if (countries.includes(normalized) || region === normalized) {
          clusters.add(region);
        }
      });
    });
    
    return Array.from(clusters);
  }

  // CATEGORIZE BY ECONOMIC TIER
 private categorizeByEconomicTier(locations: string[]): {
  tier1: string[];
  tier2: string[];
  tier3: string[];
  emerging: string[];
} {
  const tiers = { 
    tier1: [] as string[], 
    tier2: [] as string[], 
    tier3: [] as string[], 
    emerging: [] as string[] 
  };
  
  locations.forEach((location: string) => {
    const country = this.extractCountryFromLocation(location);
    const normalized = country.toLowerCase();
    
    if (COUNTRY_METADATA.economicTiers.tier1.includes(normalized)) {
      tiers.tier1.push(location);
    } else if (COUNTRY_METADATA.economicTiers.tier2.includes(normalized)) {
      tiers.tier2.push(location);
    } else if (COUNTRY_METADATA.economicTiers.tier3.includes(normalized)) {
      tiers.tier3.push(location);
    } else if (COUNTRY_METADATA.economicTiers.emerging.includes(normalized)) {
      tiers.emerging.push(location);
    }
  });
  
  return tiers;
}

  // GET TOP BUSINESS HUBS FOR GLOBAL SEARCH
  private getTopBusinessHubs(): string[] {
    return [
      'New York, US', 'London, UK', 'Tokyo, Japan', 'Singapore', 'Hong Kong',
      'Dubai, UAE', 'Frankfurt, Germany', 'Paris, France', 'Sydney, Australia',
      'Toronto, Canada', 'Zurich, Switzerland', 'Mumbai, India', 'São Paulo, Brazil',
      'Lagos, Nigeria', 'Cairo, Egypt', 'Nairobi, Kenya', 'Cape Town, South Africa',
      'Mexico City, Mexico', 'Seoul, South Korea', 'Stockholm, Sweden'
    ];
  }

  // COMPREHENSIVE INDUSTRY KEYWORD GENERATION
  private generateComprehensiveIndustryKeywords(industries: string[]): string[] {
    const keywords = new Set<string>();
    
    industries.forEach(industry => {
      // Add main industry
      keywords.add(industry);
      
      // Add comprehensive keyword set
      if (INDUSTRY_ENCYCLOPEDIA[industry as keyof typeof INDUSTRY_ENCYCLOPEDIA]) {
        INDUSTRY_ENCYCLOPEDIA[industry as keyof typeof INDUSTRY_ENCYCLOPEDIA].forEach(keyword => 
          keywords.add(keyword)
        );
      }
    });
    
    return Array.from(keywords);
  }

  // STRATEGY 1: GLOBAL PRECISION SEARCH
private async executeGlobalPrecisionSearch(criteria: any): Promise<LeadGenerationResponse> {
  console.log('🎯 Global Precision Search: Targeting specific locations with full criteria');
  
  // If multiple industries requested, do mixed search
  if (criteria.targetIndustry?.length > 1 && criteria.leadCount > criteria.targetIndustry.length) {
    return await this.executeMultiIndustryMixedSearch(criteria);
  }
  
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  // Precise role targeting
  if (criteria.expandedRoles?.length) {
    params.person_titles = criteria.expandedRoles.slice(0, 4);
  } else if (criteria.targetRole?.length) {
    params.person_titles = criteria.targetRole.slice(0, 4);
  }

  // Precise location targeting (top 6 most specific)
  if (criteria.expandedLocations?.length) {
    const sortedLocations = criteria.expandedLocations
      .sort((a: string, b: string) => b.split(',').length - a.split(',').length) // More specific first
      .slice(0, 6);
    params.person_locations = sortedLocations;
  }

  // Comprehensive industry targeting
  if (criteria.industryKeywords?.length) {
    const topKeywords = criteria.industryKeywords.slice(0, 5);
    params.q_keywords = topKeywords.join(' OR ');
  }

  // Smart company size (only if not too complex)
  if (criteria.companySize?.length && 
      criteria.targetIndustry?.length <= 2 && 
      criteria.targetRole?.length <= 3) {
    const ranges = this.convertCompanySizeRanges(criteria.companySize.slice(0, 2));
    if (ranges.length > 0) {
      params.organization_num_employees_ranges = ranges;
    }
  }

  // Revenue constraints
  if (criteria.revenueRange?.min || criteria.revenueRange?.max) {
    if (criteria.revenueRange.min) params.revenue_range_min = criteria.revenueRange.min;
    if (criteria.revenueRange.max) params.revenue_range_max = criteria.revenueRange.max;
  }

  // Contact requirements
  if (criteria.requirements?.includes('email')) {
    params.contact_email_status = ['verified'];
  }

  return await this.callGlobalApolloAPI(params, criteria, 'Global Precision');
}

private async executeMultiIndustryMixedSearch(criteria: any): Promise<LeadGenerationResponse> {
  console.log('🎯 Multi-Industry Mixed Search: Distributing leads across industries');
  
  const industries = criteria.targetIndustry;
  const totalLeads = criteria.leadCount;
  const leadsPerIndustry = Math.ceil(totalLeads / industries.length);
  
  const allLeads: GeneratedLead[] = [];
  let totalFound = 0;
  
  for (const industry of industries) {
    try {
      // Generate industry-specific keywords
      const industryKeywords = this.generateComprehensiveIndustryKeywords([industry]);
      
      const industryParams: any = {
        per_page: Math.min(leadsPerIndustry, 100),
        page: 1,
        include_similar_titles: true,
        // Target this specific industry with comprehensive keywords
        q_keywords: industryKeywords.slice(0, 3).join(' OR '),
      };
      
      // Keep role targeting
      if (criteria.expandedRoles?.length) {
        industryParams.person_titles = criteria.expandedRoles.slice(0, 4);
      } else if (criteria.targetRole?.length) {
        industryParams.person_titles = criteria.targetRole.slice(0, 4);
      }
      
      // Keep location targeting
      if (criteria.expandedLocations?.length) {
        const sortedLocations = criteria.expandedLocations
          .sort((a: string, b: string) => b.split(',').length - a.split(',').length)
          .slice(0, 6);
        industryParams.person_locations = sortedLocations;
      }
      
      // Keep company size constraints
      if (criteria.companySize?.length && criteria.companySize.length <= 2) {
        const ranges = this.convertCompanySizeRanges(criteria.companySize.slice(0, 2));
        if (ranges.length > 0) {
          industryParams.organization_num_employees_ranges = ranges;
        }
      }
      
      // Keep revenue constraints
      if (criteria.revenueRange?.min || criteria.revenueRange?.max) {
        if (criteria.revenueRange.min) industryParams.revenue_range_min = criteria.revenueRange.min;
        if (criteria.revenueRange.max) industryParams.revenue_range_max = criteria.revenueRange.max;
      }
      
      // Keep contact requirements
      if (criteria.requirements?.includes('email')) {
        industryParams.contact_email_status = ['verified'];
      }
      
      console.log(`🏭 Searching for ${industry} industry with params:`, JSON.stringify(industryParams, null, 2));
      
      const industryResponse = await this.callGlobalApolloAPI(
        industryParams, 
        { ...criteria, targetIndustry: [industry] }, 
        `Industry-${industry}`
      );
      
      if (industryResponse.leads.length > 0) {
        // Tag each lead with the source industry for tracking
        const taggedLeads = industryResponse.leads.slice(0, leadsPerIndustry).map(lead => ({
          ...lead,
          metadata: {
            ...lead.metadata,
            sourceIndustry: industry,
            searchStrategy: 'Multi-Industry Mixed'
          }
        }));
        
        allLeads.push(...taggedLeads);
        totalFound += industryResponse.totalFound || industryResponse.leads.length;
        console.log(`✅ Found ${industryResponse.leads.length} leads for ${industry}`);
      } else {
        console.log(`⚠️ No leads found for ${industry}`);
      }
      
      // Stop if we have enough leads
      if (allLeads.length >= totalLeads) break;
      
      // Add small delay between requests to avoid rate limiting
      if (industries.indexOf(industry) < industries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Failed to search ${industry}:`, error);
      // Continue with next industry instead of failing entirely
      continue;
    }
  }
  
  if (allLeads.length === 0) {
    console.log('❌ No leads found across all industries');
    // Fall back to original search strategy
    console.log('🔄 Falling back to original precision search...');
    return await this.executeOriginalPrecisionSearch(criteria);
  }
  
  // Shuffle and limit to requested count for better distribution
  const shuffledLeads = allLeads
    .sort(() => Math.random() - 0.5)
    .slice(0, totalLeads)
    .sort((a, b) => b.score - a.score); // Sort by score after shuffling
  
  console.log(`🎯 Mixed search complete: ${shuffledLeads.length} leads from ${industries.length} industries`);
  console.log(`📊 Industry distribution:`, this.getIndustryDistribution(shuffledLeads));
  
  return {
    leads: shuffledLeads,
    totalFound,
    tokensUsed: 0,
    generationTime: 1000,
    searchStrategy: 'Multi-Industry Mixed'
  };
}

// Helper method for fallback
private async executeOriginalPrecisionSearch(criteria: any): Promise<LeadGenerationResponse> {
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  if (criteria.expandedRoles?.length) {
    params.person_titles = criteria.expandedRoles.slice(0, 4);
  } else if (criteria.targetRole?.length) {
    params.person_titles = criteria.targetRole.slice(0, 4);
  }

  if (criteria.expandedLocations?.length) {
    const sortedLocations = criteria.expandedLocations
      .sort((a: string, b: string) => b.split(',').length - a.split(',').length)
      .slice(0, 6);
    params.person_locations = sortedLocations;
  }

  if (criteria.industryKeywords?.length) {
    const topKeywords = criteria.industryKeywords.slice(0, 5);
    params.q_keywords = topKeywords.join(' OR ');
  }

  return await this.callGlobalApolloAPI(params, criteria, 'Fallback Precision');
}

// Helper method to analyze industry distribution
private getIndustryDistribution(leads: GeneratedLead[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  leads.forEach(lead => {
    const sourceIndustry = lead.metadata?.sourceIndustry || 'Unknown';
    distribution[sourceIndustry] = (distribution[sourceIndustry] || 0) + 1;
  });
  
  return distribution;
}



  // STRATEGY 2: REGIONAL CLUSTER SEARCH
  private async executeRegionalClusterSearch(criteria: any): Promise<LeadGenerationResponse> {
  console.log('🌍 Regional Cluster Search: Targeting by regional groups');
  
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  // Moderate role targeting
  if (criteria.targetRole?.length) {
    params.person_titles = criteria.targetRole.slice(0, 3);
  }

  // Regional location targeting
  if (criteria.regionalClusters?.length) {
    const regionalLocations: string[] = [];
    criteria.regionalClusters.slice(0, 2).forEach((region: string) => {
      if (REGIONAL_GROUPS[region as keyof typeof REGIONAL_GROUPS]) {
        regionalLocations.push(...REGIONAL_GROUPS[region as keyof typeof REGIONAL_GROUPS].slice(0, 3));
      }
    });
    
    if (regionalLocations.length > 0) {
      // Convert country names to location variants
      const expandedRegional: string[] = [];
      regionalLocations.forEach((country: string) => {
        Object.values(GLOBAL_LOCATIONS).forEach((continent: Record<string, string[]>) => {
          if (continent[country]) {
            expandedRegional.push(...continent[country].slice(0, 2));
          }
        });
      });
      params.person_locations = expandedRegional.slice(0, 6);
    }
  }

  // Simplified industry targeting
  if (criteria.targetIndustry?.length) {
    params.q_keywords = criteria.targetIndustry.slice(0, 3).join(' OR ');
  }

  return await this.callGlobalApolloAPI(params, criteria, 'Regional Cluster');
}

  // STRATEGY 3: INDUSTRY FOCUS SEARCH
  private async executeIndustryFocusSearch(criteria: any): Promise<LeadGenerationResponse> {
    console.log('🏭 Industry Focus Search: Heavy industry keyword targeting');
    
    const params: any = {
      per_page: Math.min(criteria.leadCount, 100),
      page: 1,
      include_similar_titles: true
    };

    // Executive-level roles
    params.person_titles = ['CEO', 'President', 'Director', 'VP', 'Manager', 'Founder'];

    // Comprehensive industry keyword targeting
    if (criteria.industryKeywords?.length) {
      const keywordGroups = this.groupKeywordsByRelevance(criteria.industryKeywords);
      params.q_keywords = keywordGroups.primary.slice(0, 8).join(' OR ');
    }

    // Broad location targeting (economic tiers)
    if (criteria.economicTiers) {
      const tierLocations = [
        ...(criteria.economicTiers.tier1 || []).slice(0, 2),
        ...(criteria.economicTiers.tier2 || []).slice(0, 2)
      ];
      if (tierLocations.length > 0) {
        params.person_locations = tierLocations;
      }
    }

    return await this.callGlobalApolloAPI(params, criteria, 'Industry Focus');
  }

  // STRATEGY 4: ECONOMIC TIER SEARCH
  private async executeEconomicTierSearch(criteria: any): Promise<LeadGenerationResponse> {
    console.log('💰 Economic Tier Search: Targeting by economic development level');
    
    const params: any = {
      per_page: Math.min(criteria.leadCount, 100),
      page: 1,
      include_similar_titles: true
    };

    // Senior roles for economic targeting
    params.person_titles = ['CEO', 'Founder', 'President', 'Director'];

    // Economic tier location targeting (start with highest tiers)
    if (criteria.economicTiers) {
      const priorityLocations = [
        ...(criteria.economicTiers.tier1 || []),
        ...(criteria.economicTiers.tier2 || []),
        ...(criteria.economicTiers.tier3 || [])
      ].slice(0, 8);
      
      if (priorityLocations.length > 0) {
        params.person_locations = priorityLocations;
      }
    }

    // Basic industry filter
    if (criteria.targetIndustry?.length) {
      params.q_keywords = criteria.targetIndustry[0];
    }

    return await this.callGlobalApolloAPI(params, criteria, 'Economic Tier');
  }

  // STRATEGY 5: CONTINENTAL BROADCAST
private async executeContinentalBroadcast(criteria: any): Promise<LeadGenerationResponse> {
  console.log('🌐 Continental Broadcast: Wide geographical targeting');
  
  const params: any = {
    per_page: Math.min(criteria.leadCount, 100),
    page: 1,
    include_similar_titles: true
  };

  // Very broad role search
  params.person_titles = ['CEO', 'Founder', 'President'];

  // Continental targeting
  if (criteria.regionalClusters?.length) {
    const continentalLocations: string[] = [];
    criteria.regionalClusters.forEach((region: string) => {
      if (region.includes('africa')) {
        continentalLocations.push('Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Egypt');
      } else if (region.includes('asia')) {
        continentalLocations.push('India', 'China', 'Singapore', 'Japan', 'South Korea');
      } else if (region.includes('europe')) {
        continentalLocations.push('United Kingdom', 'Germany', 'France', 'Netherlands');
      } else if (region.includes('america')) {
        continentalLocations.push('United States', 'Canada', 'Brazil', 'Mexico');
      }
    });
    
    if (continentalLocations.length > 0) {
      params.person_locations = continentalLocations.slice(0, 10);
    }
  }

  // Single industry focus
  if (criteria.targetIndustry?.length) {
    params.q_keywords = criteria.targetIndustry[0];
  }

  return await this.callGlobalApolloAPI(params, criteria, 'Continental Broadcast');
}
    // services/apollo.service.ts - PART 2 (COMPLETION)
// This is the continuation of the Global Apollo Service

  // STRATEGY 6: GLOBAL EMERGENCY SEARCH
  private async executeGlobalEmergencySearch(criteria: any): Promise<LeadGenerationResponse> {
    console.log('🆘 Global Emergency Search: Last resort broad targeting');
    
    const params: any = {
      per_page: Math.min(criteria.leadCount, 100),
      page: 1,
      include_similar_titles: true,
      person_titles: ['CEO', 'President', 'Director', 'Manager', 'Founder', 'VP']
    };

    // Global business hubs
    params.person_locations = this.getTopBusinessHubs().slice(0, 15);

    return await this.callGlobalApolloAPI(params, criteria, 'Global Emergency');
  }

  // ENHANCED APOLLO API CALLER WITH GLOBAL INTELLIGENCE
  private async callGlobalApolloAPI(params: any, criteria: any, strategy: string): Promise<LeadGenerationResponse> {
    console.log(`🌐 ${strategy} Apollo API call:`, JSON.stringify(params, null, 2));
    
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apolloApiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'User-Agent': 'GlobalLeadEngine/1.0'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${strategy} Apollo API error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500)
        });
        
        // Enhanced error handling
        if (response.status === 401 || response.status === 403) {
          throw new Error('Apollo API authentication failed. Check API key.');
        }
        if (response.status === 429) {
          throw new Error('Apollo API rate limit exceeded. Please wait before retrying.');
        }
        if (response.status === 422 || response.status === 400) {
          try {
            const errorData = JSON.parse(errorText);
            const errorMsg = errorData.message || errorData.error || 'Invalid search parameters';
            throw new Error(`Apollo API validation error: ${errorMsg}`);
          } catch {
            throw new Error('Apollo API rejected search parameters. Trying next strategy...');
          }
        }
        if (response.status >= 500) {
          throw new Error('Apollo API server error. Please try again later.');
        }
        
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 ${strategy} response: ${data.people?.length || 0} people found, total entries: ${data.pagination?.total_entries || 0}`);

      const leads = this.processGlobalApolloResponse(data, criteria);
      
      return {
        leads,
        totalFound: data.pagination?.total_entries || leads.length,
        tokensUsed: 0,
        generationTime: 1000,
        apolloBatchId: data.pagination?.page?.toString(),
        searchStrategy: strategy
      };

    } catch (error) {
      console.error(`💥 ${strategy} Apollo API call failed:`, error);
      throw error;
    }
  }

  // ENHANCED GLOBAL RESPONSE PROCESSING
  private processGlobalApolloResponse(data: any, criteria: any): GeneratedLead[] {
    const contacts = data.people || data.contacts || [];
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      console.log('❌ No contacts found in Apollo response');
      return [];
    }

    console.log(`✅ Processing ${contacts.length} contacts from Apollo`);

    const processedLeads = contacts
      .filter(contact => this.isValidGlobalContact(contact))
      .filter(contact => this.filterByGlobalRequirements(contact, criteria))
      .map((contact, index) => this.formatGlobalLead(contact, index))
      .filter(Boolean)
      .filter(lead => 
        lead.name !== 'Unknown' && 
        lead.company !== 'Unknown Company' &&
        lead.location !== 'Unknown'
      )
    .sort((a: GeneratedLead, b: GeneratedLead) => b.score - a.score);

    console.log(`📋 After global filtering and processing: ${processedLeads.length} valid leads`);
    return processedLeads;
  }

  // ENHANCED GLOBAL CONTACT VALIDATION
  private isValidGlobalContact(contact: any): boolean {
    const hasName = contact.name || (contact.first_name && contact.last_name);
    const hasOrganization = contact.organization?.name;
    const hasTitle = contact.title;
    const hasLocation = contact.city || contact.state || contact.country;
    
    // Must have name, org/title, and some location info
    return !!(hasName && (hasOrganization || hasTitle) && hasLocation);
  }

  // ENHANCED GLOBAL REQUIREMENTS FILTERING
  private filterByGlobalRequirements(contact: any, criteria: any): boolean {
    if (!criteria.requirements?.length) return true;

    const requirements = criteria.requirements;
    
    if (requirements.includes('email') && !this.hasValidGlobalEmail(contact)) {
      return false;
    }

    if (requirements.includes('phone') && !this.hasValidGlobalPhone(contact)) {
      return false;
    }

    if (requirements.includes('linkedin') && !contact.linkedin_url) {
      return false;
    }

    return true;
  }

  // ENHANCED GLOBAL LEAD FORMATTING
  private formatGlobalLead(contact: any, index: number): GeneratedLead {
    const globalLocation = this.formatGlobalLocation(contact);
    const enhancedEmail = this.generateGlobalEmail(contact);
    const globalScore = this.calculateGlobalLeadScore(contact);
    const countryCode = this.extractCountryCode(contact);
    
    return {
      id: contact.id || `global_apollo_${Date.now()}_${index}`,
      name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
      email: enhancedEmail,
      phone: this.formatGlobalPhone(contact),
      title: contact.title || 'Unknown Title',
      company: contact.organization?.name || 'Unknown Company',
      industry: this.extractGlobalIndustry(contact.organization),
      companySize: this.formatCompanySize(contact.organization?.organization_headcount || 
                                         contact.organization?.estimated_num_employees),
      location: globalLocation,
      linkedinUrl: contact.linkedin_url || undefined,
      website: contact.organization?.website_url || undefined,
      score: globalScore,
      apolloId: contact.id,
      metadata: {
        companyRevenue: this.formatRevenue(contact.organization),
        technologies: contact.organization?.technologies?.map((t: any) => t.name) || [],
        employeeCount: contact.organization?.organization_headcount || 
                      contact.organization?.estimated_num_employees,
        founded: contact.organization?.founded_year?.toString(),
        departments: contact.departments || [],
        seniority: contact.seniority,
        emailStatus: contact.email_status,
        countryCode: countryCode,
        timezone: this.getTimezoneForCountry(countryCode),
        currency: this.getCurrencyForCountry(countryCode)
      }
    };
  }

  // GLOBAL LOCATION FORMATTING
  private formatGlobalLocation(contact: any): string {
    const parts = [];
    
    if (contact.city) parts.push(contact.city);
    if (contact.state && contact.state !== contact.city) parts.push(contact.state);
    if (contact.country && contact.country !== contact.state) parts.push(contact.country);
    
    if (parts.length === 0) {
      // Try to extract from organization
      if (contact.organization?.hq_location) {
        return contact.organization.hq_location;
      }
      return 'Global';
    }
    
    return parts.join(', ');
  }

  // GLOBAL EMAIL GENERATION
  private generateGlobalEmail(contact: any): string {
    if (contact.email && 
        contact.email !== "email_not_unlocked@domain.com" && 
        contact.email.includes('@')) {
      return contact.email;
    }
    
    const firstName = (contact.first_name || contact.name?.split(' ')[0] || 'contact').toLowerCase();
    const lastName = (contact.last_name || contact.name?.split(' ')[1] || 'person').toLowerCase();
    
    let domain = contact.organization?.primary_domain || 
                contact.organization?.website_url?.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    
    if (!domain) {
      const companyName = (contact.organization?.name || 'company')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      const country = this.extractCountryCode(contact);
      const tld = this.getCountryTLD(country);
      domain = `${companyName}.${tld}`;
    }
    
    return `${firstName}.${lastName}@${domain}`;
  }

  // GLOBAL PHONE FORMATTING
  private formatGlobalPhone(contact: any): string | undefined {
    if (contact.phone_numbers?.length > 0) {
      return contact.phone_numbers[0].sanitized_number || contact.phone_numbers[0].raw_number;
    }
    
    if (contact.organization?.primary_phone?.sanitized_number) {
      return contact.organization.primary_phone.sanitized_number;
    }
    
    if (contact.organization?.phone) {
      return contact.organization.phone;
    }
    
    return undefined;
  }

  // GLOBAL LEAD SCORING
  private calculateGlobalLeadScore(contact: any): number {
    let score = 50; // Base score
    
    // Email quality
    if (contact.email && contact.email_status === 'verified') score += 25;
    else if (contact.email && contact.email !== "email_not_unlocked@domain.com") score += 15;
    
    // Contact info
    if (contact.phone_numbers?.length > 0) score += 15;
    if (contact.linkedin_url) score += 10;
    
    // Title seniority
    const title = contact.title?.toLowerCase() || '';
    if (/\b(ceo|chief executive|president|founder)\b/.test(title)) score += 20;
    else if (/\b(cto|cfo|cmo|coo|chief)\b/.test(title)) score += 15;
    else if (/\b(vp|vice president|director)\b/.test(title)) score += 10;
    else if (/\b(manager|head)\b/.test(title)) score += 5;
    
    // Company size
    const empCount = contact.organization?.estimated_num_employees || 
                    contact.organization?.organization_headcount;
    if (empCount) {
      if (empCount >= 1000) score += 15;
      else if (empCount >= 100) score += 10;
      else if (empCount >= 50) score += 5;
    }
    
    // Company maturity
    if (contact.organization?.founded_year) {
      const age = new Date().getFullYear() - contact.organization.founded_year;
      if (age >= 10) score += 10;
      else if (age >= 5) score += 5;
    }
    
    // Technology stack
    if (contact.organization?.technologies?.length > 0) score += 5;
    
    // Recent activity
    if (contact.organization?.recent_news?.length > 0) score += 5;
    
    // Location tier bonus
    const country = this.extractCountryCode(contact);
    if (COUNTRY_METADATA.economicTiers.tier1.includes(country)) score += 10;
    else if (COUNTRY_METADATA.economicTiers.tier2.includes(country)) score += 5;
    
    return Math.min(Math.max(score, 1), 100);
  }

  // UTILITY FUNCTIONS
  private extractCountryCode(contact: any): string {
    const location = contact.country || contact.state || contact.city || '';
    const normalized = location.toLowerCase();
    
    // Direct country match
    for (const [continent, countries] of Object.entries(GLOBAL_LOCATIONS)) {
      for (const [code, variants] of Object.entries(countries)) {
        if (variants.some(variant => normalized.includes(variant.toLowerCase()))) {
          return code;
        }
      }
    }
    
    // Fallback to parsing from location string
   // Fallback to parsing from location string
if (location.includes(',')) {
  const parts = location.split(',').map((s: string) => s.trim().toLowerCase());
  for (const part of parts.reverse()) { // Check from right to left
    for (const [continent, countries] of Object.entries(GLOBAL_LOCATIONS)) {
      for (const [code, variants] of Object.entries(countries)) {
        if (variants.some(variant => part.includes(variant.toLowerCase()))) {
          return code;
        }
      }
    }
  }
}
    
    return 'unknown';
  }

 private getTimezoneForCountry(countryCode: string): string {
  return (COUNTRY_METADATA.timezones as Record<string, string>)[countryCode] || 'GMT';
}

private getCountryTLD(countryCode: string): string {
  return (COUNTRY_METADATA.domains as Record<string, string>)[countryCode] || 'com';
}

private getCurrencyForCountry(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    'ghana': 'GHS',
    'nigeria': 'NGN',
    'kenya': 'KES',
    'south africa': 'ZAR',
    'india': 'INR',
    'china': 'CNY',
    'japan': 'JPY',
    'united kingdom': 'GBP',
    'germany': 'EUR',
    'france': 'EUR',
    'united states': 'USD',
    'canada': 'CAD',
    'australia': 'AUD',
    'brazil': 'BRL'
  };
  
  return currencyMap[countryCode] || 'USD';
}

  private extractCountries(locations: string[]): string[] {
    const countries = new Set<string>();
    
    locations.forEach(location => {
      const country = this.extractCountryFromLocation(location);
      if (country !== 'unknown') {
        countries.add(country);
      }
    });
    
    return Array.from(countries);
  }

  private extractCountryFromLocation(location: string): string {
    const normalized = location.toLowerCase();
    
    // Check if it's a direct country match
    for (const [continent, countries] of Object.entries(GLOBAL_LOCATIONS)) {
      for (const [code, variants] of Object.entries(countries)) {
        if (variants.some(variant => normalized === variant.toLowerCase())) {
          return code;
        }
      }
    }
    
    // Extract from comma-separated location
    if (location.includes(',')) {
      const parts = location.split(',').map(s => s.trim().toLowerCase());
      const countryPart = parts[parts.length - 1]; // Last part is usually country
      
      for (const [continent, countries] of Object.entries(GLOBAL_LOCATIONS)) {
        for (const [code, variants] of Object.entries(countries)) {
          if (variants.some(variant => countryPart.includes(variant.toLowerCase()))) {
            return code;
          }
        }
      }
    }
    
    return 'unknown';
  }

  private findFuzzyLocationMatches(input: string): string[] {
    const matches = [];
    const inputLower = input.toLowerCase();
    
    // Simple fuzzy matching for common misspellings
    const fuzzyMap: { [key: string]: string[] } = {
      'gana': ['Ghana'],
      'kenia': ['Kenya'],
      'uk': ['United Kingdom'],
      'usa': ['United States'],
      'uae': ['UAE'],
      'sa': ['South Africa'],
      'brasil': ['Brazil'],
      'lagos': ['Lagos, Nigeria'],
      'nairobi': ['Nairobi, Kenya'],
      'accra': ['Accra, Ghana'],
      'cairo': ['Cairo, Egypt'],
      'mumbai': ['Mumbai, India'],
      'delhi': ['Delhi, India'],
      'singapore': ['Singapore'],
      'sydney': ['Sydney, Australia'],
      'toronto': ['Toronto, Canada']
    };
    
    if (fuzzyMap[inputLower]) {
      matches.push(...fuzzyMap[inputLower]);
    }
    
    return matches;
  }

  private expandJobTitles(roles: string[]): string[] {
    const expanded = new Set<string>();
    
    roles.forEach(role => {
      expanded.add(role);
      
      // Add variations
      const roleLower = role.toLowerCase();
      if (roleLower.includes('ceo')) {
        expanded.add('Chief Executive Officer');
        expanded.add('Chief Executive');
        expanded.add('President');
      }
      if (roleLower.includes('cto')) {
        expanded.add('Chief Technology Officer');
        expanded.add('VP Technology');
        expanded.add('Head of Technology');
      }
      if (roleLower.includes('cfo')) {
        expanded.add('Chief Financial Officer');
        expanded.add('VP Finance');
        expanded.add('Head of Finance');
      }
      if (roleLower.includes('cmo')) {
        expanded.add('Chief Marketing Officer');
        expanded.add('VP Marketing');
        expanded.add('Head of Marketing');
      }
      if (roleLower.includes('director')) {
        expanded.add(role.replace('Director', 'Head'));
        expanded.add(role.replace('Director', 'Manager'));
      }
      if (roleLower.includes('vp')) {
        expanded.add(role.replace('VP', 'Vice President'));
        expanded.add(role.replace('VP', 'Director'));
      }
    });
    
    return Array.from(expanded);
  }

private categorizeRoleSeniority(roles: string[]): {
  executive: string[];
  senior: string[];
  mid: string[];
  junior: string[];
} {
  const categories = { 
    executive: [] as string[], 
    senior: [] as string[], 
    mid: [] as string[], 
    junior: [] as string[] 
  };
  
  roles.forEach((role: string) => {
    const roleLower = role.toLowerCase();
    if (/\b(ceo|cto|cfo|cmo|president|founder|chief)\b/.test(roleLower)) {
      categories.executive.push(role);
    } else if (/\b(vp|vice president|director)\b/.test(roleLower)) {
      categories.senior.push(role);
    } else if (/\b(manager|head|lead)\b/.test(roleLower)) {
      categories.mid.push(role);
    } else {
      categories.junior.push(role);
    }
  });
  
  return categories;
}

  private findRelatedIndustries(industries: string[]): string[] {
    const related = new Set<string>();
    
    industries.forEach(industry => {
      // Add related industries based on common overlaps
      switch (industry.toLowerCase()) {
        case 'technology':
          related.add('Software');
          related.add('IT Services');
          related.add('Telecommunications');
          break;
        case 'healthcare':
          related.add('Pharmaceuticals');
          related.add('Biotechnology');
          related.add('Medical Devices');
          break;
        case 'finance':
          related.add('Banking');
          related.add('Insurance');
          related.add('Investment');
          break;
        case 'manufacturing':
          related.add('Industrial');
          related.add('Automotive');
          related.add('Aerospace');
          break;
        case 'retail':
          related.add('E-commerce');
          related.add('Consumer Goods');
          related.add('Fashion');
          break;
      }
    });
    
    return Array.from(related);
  }

 private groupKeywordsByRelevance(keywords: string[]): { primary: string[]; secondary: string[] } {
  const primary: string[] = [];
  const secondary: string[] = [];
  
  keywords.forEach(keyword => {
    // Primary keywords are more specific/industry-focused
    if (keyword.length > 3 && !['tech', 'data', 'web'].includes(keyword.toLowerCase())) {
      primary.push(keyword);
    } else {
      secondary.push(keyword);
    }
  });
  
  return { primary, secondary };
}

  private convertCompanySizeRanges(sizes: string[]): string[] {
    const ranges: string[] = [];
    sizes.forEach(size => {
      switch (size) {
        case '1-10': ranges.push('1,10'); break;
        case '11-50': ranges.push('11,50'); break;
        case '51-200': ranges.push('51,200'); break;
        case '201-500': ranges.push('201,500'); break;
        case '501-1000': ranges.push('501,1000'); break;
        case '1000+': ranges.push('1001,'); break;
      }
    });
    return ranges;
  }

  private hasValidGlobalEmail(contact: any): boolean {
    return !!(contact.email && 
             contact.email !== "email_not_unlocked@domain.com" && 
             contact.email.includes('@') &&
             !contact.email.includes('example.com'));
  }

  private hasValidGlobalPhone(contact: any): boolean {
    return !!(contact.phone_numbers?.length > 0 || 
             contact.organization?.primary_phone ||
             contact.organization?.phone);
  }

  private extractGlobalIndustry(organization: any): string {
    if (!organization) return 'Unknown';
    
    // Enhanced industry detection with global context
    const name = organization.name?.toLowerCase() || '';
    const description = organization.description?.toLowerCase() || '';
    const website = organization.website_url?.toLowerCase() || '';
    const combined = `${name} ${description} ${website}`;
    
    // Check industry keywords with weighted scoring
    const industryScores: { [key: string]: number } = {};
    
    Object.entries(INDUSTRY_ENCYCLOPEDIA).forEach(([industry, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (name.includes(keywordLower)) score += 3; // Company name match = highest weight
        else if (description.includes(keywordLower)) score += 2;
        else if (website.includes(keywordLower)) score += 1;
      });
      
      if (score > 0) {
        industryScores[industry] = score;
      }
    });
    
    // Return industry with highest score
    if (Object.keys(industryScores).length > 0) {
    return Object.entries(industryScores)
  .sort(([,a]: [string, number], [,b]: [string, number]) => b - a)[0][0];
    }
    
    // Fallback to SIC/NAICS codes if available
    const sicCodes = organization.sic_codes || [];
    const naicsCodes = organization.naics_codes || [];
    
    // Enhanced SIC/NAICS mapping
    const industryCodeMap: { [key: string]: string } = {
      // Technology
      '54': 'Technology', '541': 'Technology', '5415': 'Technology', '54151': 'Technology',
      '334': 'Technology', '3341': 'Technology', '33411': 'Technology',
      '5112': 'Technology', '51121': 'Technology', '518': 'Technology', '5182': 'Technology',
      
      // Healthcare  
      '62': 'Healthcare', '621': 'Healthcare', '622': 'Healthcare', '623': 'Healthcare',
      '3254': 'Healthcare', '32541': 'Healthcare', '325412': 'Healthcare',
      '339112': 'Healthcare', '339113': 'Healthcare', '339114': 'Healthcare',
      
      // Finance
      '52': 'Finance', '521': 'Finance', '522': 'Finance', '523': 'Finance', '524': 'Finance',
      '525': 'Finance', '531': 'Finance', '532': 'Finance', '533': 'Finance',
      
      // Manufacturing
      '31': 'Manufacturing', '32': 'Manufacturing', '33': 'Manufacturing',
      '311': 'Manufacturing', '312': 'Manufacturing', '313': 'Manufacturing',
      '314': 'Manufacturing', '315': 'Manufacturing', '316': 'Manufacturing',
      
      // Retail
      '44': 'Retail', '45': 'Retail', '441': 'Retail', '442': 'Retail',
      '443': 'Retail', '444': 'Retail', '445': 'Retail', '446': 'Retail',
      
      // Energy
      '21': 'Energy', '211': 'Energy', '213': 'Energy', '22': 'Energy',
      '221': 'Energy', '2211': 'Energy', '22111': 'Energy', '22112': 'Energy'
    };
    
    for (const code of [...sicCodes, ...naicsCodes]) {
      const codeStr = code.toString();
      
      // Try exact match first
      if (industryCodeMap[codeStr]) {
        return industryCodeMap[codeStr];
      }
      
      // Try prefix matches
      for (const [prefix, industry] of Object.entries(industryCodeMap)) {
        if (codeStr.startsWith(prefix)) {
          return industry;
        }
      }
    }
    
    return 'Other';
  }

  private formatRevenue(organization: any): string {
    if (!organization) return 'Unknown';
    
    // Try to get actual revenue if available
    if (organization.estimated_revenue) {
      return this.formatRevenueNumber(organization.estimated_revenue);
    }
    
    // Estimate based on employee count with global context
    const headcount = organization.organization_headcount || organization.estimated_num_employees;
    if (!headcount) return 'Unknown';
    
    // Global revenue estimates adjusted for economic tiers
    const location = organization.hq_location || organization.primary_location || '';
    const isHighTier = ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia'].some(country => 
      location.toLowerCase().includes(country.toLowerCase())
    );
    
    if (isHighTier) {
      // Higher revenue estimates for developed markets
      if (headcount <= 10) return '$500K-$2M';
      if (headcount <= 50) return '$2M-$15M';
      if (headcount <= 200) return '$15M-$75M';
      if (headcount <= 1000) return '$75M-$750M';
      return '$750M+';
    } else {
      // Conservative estimates for emerging markets
      if (headcount <= 10) return '$100K-$1M';
      if (headcount <= 50) return '$1M-$10M';
      if (headcount <= 200) return '$10M-$50M';
      if (headcount <= 1000) return '$50M-$500M';
      return '$500M+';
    }
  }

  private formatRevenueNumber(revenue: number): string {
    if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`;
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue}`;
  }

  private formatCompanySize(empCount?: number): string {
    if (!empCount) return 'Unknown';
    
    if (empCount <= 10) return '1-10';
    if (empCount <= 50) return '11-50';
    if (empCount <= 200) return '51-200';
    if (empCount <= 500) return '201-500';
    if (empCount <= 1000) return '501-1000';
    return '1000+';
  }

  private generateGlobalCacheKey(criteria: any): string {
    const keyData = {
      industries: criteria.targetIndustry?.sort(),
      roles: criteria.targetRole?.sort(),
      locations: criteria.expandedLocations?.sort(),
      companySize: criteria.companySize?.sort(),
      leadCount: criteria.leadCount,
      requirements: criteria.requirements?.sort(),
      globalCoverage: criteria.globalCoverage
    };
    
    const key = `global_apollo:${JSON.stringify(keyData)}`;
    return key.replace(/[^a-zA-Z0-9:]/g, '_').substring(0, 250);
  }

  // ENHANCED METHODS (save/get/delete) with global metadata
async saveLeadGeneration(
  userId: string,
  workspaceId: string,
  response: LeadGenerationResponse,
  criteria: LeadGenerationCriteria,
  campaignName?: string
): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const deliverable = await prisma.deliverable.create({
      data: {
        title: campaignName || `Global Lead Generation - ${criteria.targetIndustry.join(', ')}`,
        content: JSON.stringify(response),
        type: 'lead-generation',
        user_id: userId,
        workspace_id: workspaceId,
        metadata: {
          criteria,
          leadCount: response.leads.length,
          totalFound: response.totalFound,
          generatedAt: new Date().toISOString(),
          apolloBatchId: response.apolloBatchId,
          generationTime: response.generationTime,
          averageScore: response.leads.reduce((sum, lead) => sum + lead.score, 0) / response.leads.length,
          searchStrategy: response.searchStrategy,
          globalCoverage: response.globalCoverage,
          version: '2.0-global',
          qualityMetrics: {
            emailCount: response.leads.filter(l => l.email).length,
            phoneCount: response.leads.filter(l => l.phone).length,
            linkedinCount: response.leads.filter(l => l.linkedinUrl).length,
            avgEmployeeCount: response.leads.reduce((sum, lead) => sum + (lead.metadata?.employeeCount || 0), 0) / response.leads.length,
            countriesRepresented: [...new Set(response.leads.map(l => l.metadata?.countryCode).filter(Boolean))].length
          }
        } as any, // Type assertion for Prisma JsonValue compatibility
        tags: [
          'lead-generation',
          'apollo',
          'global',
          `strategy-${response.searchStrategy?.toLowerCase().replace(/\s+/g, '-')}`,
          ...(criteria.targetIndustry || []),
          ...(criteria.targetRole || []),
          ...(response.globalCoverage?.countries || [])
        ].filter(Boolean)
      }
    });

    return deliverable.id;
  } catch (error) {
    console.error('Error saving global lead generation:', error);
    throw error;
  }
}

  async getUserLeadGenerations(userId: string, workspaceId?: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'lead_generation'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const generations = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`Found ${generations.length} global lead generations in database`);
      
      return generations.map(gen => {
        const metadata = gen.metadata as any;
        
        let leadCount = metadata?.leadCount || 0;
        let totalFound = metadata?.totalFound || 0;
        let averageScore = metadata?.averageScore || 0;
        
        if (gen.content) {
          try {
            const parsedContent = JSON.parse(gen.content);
            if (parsedContent.leads && Array.isArray(parsedContent.leads)) {
              leadCount = parsedContent.leads.length;
              totalFound = parsedContent.totalFound || parsedContent.leads.length;
              
              if (parsedContent.leads.length > 0) {
                const totalScore = parsedContent.leads.reduce((sum: number, lead: any) => 
                  sum + (lead.score || 0), 0);
                averageScore = totalScore / parsedContent.leads.length;
              }
            }
          } catch (parseError) {
            console.warn(`Failed to parse content for generation ${gen.id}:`, parseError);
          }
        }
        
        return {
          id: gen.id,
          title: gen.title,
          content: gen.content,
          leadCount,
          totalFound,
          averageScore,
          criteria: metadata?.criteria || {},
          generatedAt: metadata?.generatedAt,
          generationTime: metadata?.generationTime,
          searchStrategy: metadata?.searchStrategy,
          globalCoverage: metadata?.globalCoverage,
          qualityMetrics: metadata?.qualityMetrics,
          version: metadata?.version,
          createdAt: gen.created_at,
          updatedAt: gen.updated_at,
          workspace: gen.workspace
        };
      });
    } catch (error) {
      console.error('Error fetching global lead generations:', error);
      return [];
    }
  }

  async deleteLeadGeneration(userId: string, generationId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: generationId,
          user_id: userId,
          type: 'lead_generation'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting global lead generation:', error);
      throw error;
    }
  }

  // ADDITIONAL UTILITY METHODS FOR GLOBAL OPERATIONS

  // Get global lead statistics
 async getGlobalLeadStatistics(userId: string, workspaceId?: string): Promise<any> {
  try {
    const generations = await this.getUserLeadGenerations(userId, workspaceId);
    
    const stats = {
      totalGenerations: generations.length,
      totalLeads: generations.reduce((sum, gen) => sum + gen.leadCount, 0),
      averageLeadsPerGeneration: 0,
      topStrategies: {} as { [key: string]: number },
      globalCoverage: {
        totalCountries: new Set<string>(),
        topCountries: {} as { [key: string]: number },
        regionDistribution: {} as { [key: string]: number }
      },
      qualityMetrics: {
        averageScore: 0,
        emailAvailability: 0,
        phoneAvailability: 0,
        linkedinAvailability: 0
      },
      industryDistribution: {} as { [key: string]: number },
      timeAnalysis: {
        generationsLast30Days: 0,
        generationsLast7Days: 0,
        averageGenerationTime: 0
      }
    };

    if (generations.length === 0) return stats;

    // Calculate averages
    stats.averageLeadsPerGeneration = stats.totalLeads / stats.totalGenerations;

    let totalScore = 0;
    let totalEmails = 0;
    let totalPhones = 0;
    let totalLinkedins = 0;
    let totalGenerationTime = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    generations.forEach(gen => {
      // Strategy distribution
      const strategy = gen.searchStrategy || 'Unknown';
      stats.topStrategies[strategy] = (stats.topStrategies[strategy] || 0) + 1;

      // Global coverage
      if (gen.globalCoverage?.countries) {
        gen.globalCoverage.countries.forEach((country: string) => {
          stats.globalCoverage.totalCountries.add(country);
          stats.globalCoverage.topCountries[country] = 
            (stats.globalCoverage.topCountries[country] || 0) + gen.leadCount;
        });
      }

      if (gen.globalCoverage?.regions) {
        gen.globalCoverage.regions.forEach((region: string) => {
          stats.globalCoverage.regionDistribution[region] = 
            (stats.globalCoverage.regionDistribution[region] || 0) + gen.leadCount;
        });
      }

      // Quality metrics
      totalScore += gen.averageScore || 0;
      
      if (gen.qualityMetrics) {
        totalEmails += gen.qualityMetrics.emailCount || 0;
        totalPhones += gen.qualityMetrics.phoneCount || 0;
        totalLinkedins += gen.qualityMetrics.linkedinCount || 0;
      }

      // Industry distribution
      if (gen.criteria?.targetIndustry) {
        gen.criteria.targetIndustry.forEach((industry: string) => {
          stats.industryDistribution[industry] = 
            (stats.industryDistribution[industry] || 0) + gen.leadCount;
        });
      }

      // Time analysis
      const createdAt = new Date(gen.createdAt);
      if (createdAt >= thirtyDaysAgo) stats.timeAnalysis.generationsLast30Days++;
      if (createdAt >= sevenDaysAgo) stats.timeAnalysis.generationsLast7Days++;
      
      totalGenerationTime += gen.generationTime || 0;
    });

    // Finalize calculations
    stats.qualityMetrics.averageScore = totalScore / stats.totalGenerations;
    stats.qualityMetrics.emailAvailability = (totalEmails / stats.totalLeads) * 100;
    stats.qualityMetrics.phoneAvailability = (totalPhones / stats.totalLeads) * 100;
    stats.qualityMetrics.linkedinAvailability = (totalLinkedins / stats.totalLeads) * 100;
    stats.timeAnalysis.averageGenerationTime = totalGenerationTime / stats.totalGenerations;

    // Convert sets to counts - FIX THIS
    const finalStats = {
      ...stats,
      globalCoverage: {
        ...stats.globalCoverage,
        totalCountries: stats.globalCoverage.totalCountries.size
      }
    };

    return finalStats;
  } catch (error) {
    console.error('Error calculating global lead statistics:', error);
    return null;
  }
}

  // Export leads to various formats
  async exportGlobalLeads(
    userId: string, 
    generationId: string, 
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const generation = await prisma.deliverable.findFirst({
        where: {
          id: generationId,
          user_id: userId,
          type: 'lead_generation'
        }
      });

      if (!generation) {
        throw new Error('Lead generation not found');
      }

      const data = JSON.parse(generation.content);
      const leads = data.leads || [];

      if (format === 'json') {
        return JSON.stringify(leads, null, 2);
      }

      if (format === 'csv') {
        const headers = [
          'Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 
          'Company Size', 'Location', 'LinkedIn URL', 'Website', 
          'Score', 'Country Code', 'Timezone', 'Currency'
        ];

        const csvRows = [
          headers.join(','),
          ...leads.map((lead: any) => [
            `"${lead.name || ''}"`,
            `"${lead.email || ''}"`,
            `"${lead.phone || ''}"`,
            `"${lead.title || ''}"`,
            `"${lead.company || ''}"`,
            `"${lead.industry || ''}"`,
            `"${lead.companySize || ''}"`,
            `"${lead.location || ''}"`,
            `"${lead.linkedinUrl || ''}"`,
            `"${lead.website || ''}"`,
            lead.score || 0,
            `"${lead.metadata?.countryCode || ''}"`,
            `"${lead.metadata?.timezone || ''}"`,
            `"${lead.metadata?.currency || ''}"`
          ].join(','))
        ];

        return csvRows.join('\n');
      }

      // For XLSX format, you'd need to implement XLSX generation
      // This is a placeholder - you'd use a library like 'xlsx' or 'exceljs'
      throw new Error('XLSX format not implemented yet');

    } catch (error) {
      console.error('Error exporting global leads:', error);
      throw error;
    }
  }

  // Bulk operations for lead management
async bulkUpdateLeadScores(userId: string, generationId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const generation = await prisma.deliverable.findFirst({
      where: {
        id: generationId,
        user_id: userId,
        type: 'lead_generation'
      }
    });

    if (!generation) return false;

    const data = JSON.parse(generation.content);
    const leads = data.leads || [];

    // Recalculate scores for all leads
    const updatedLeads = leads.map((lead: any) => {
      const mockContact = {
        email: lead.email,
        email_status: lead.metadata?.emailStatus,
        phone_numbers: lead.phone ? [{ sanitized_number: lead.phone }] : [],
        linkedin_url: lead.linkedinUrl,
        title: lead.title,
        organization: {
          estimated_num_employees: lead.metadata?.employeeCount,
          founded_year: lead.metadata?.founded ? parseInt(lead.metadata.founded) : undefined,
          technologies: lead.metadata?.technologies?.map((t: string) => ({ name: t })) || [],
          recent_news: []
        },
        city: lead.location?.split(',')[0],
        country: lead.metadata?.countryCode
      };

      return {
        ...lead,
        score: this.calculateGlobalLeadScore(mockContact)
      };
    });

    // Update the generation with new scores
    const updatedData = {
      ...data,
      leads: updatedLeads
    };

    // Fix the metadata spread issue
    const currentMetadata = generation.metadata as any;
    const newMetadata = {
      ...currentMetadata,
      averageScore: updatedLeads.reduce((sum: number, lead: any) => sum + lead.score, 0) / updatedLeads.length,
      lastScoreUpdate: new Date().toISOString()
    };

    await prisma.deliverable.update({
      where: { id: generationId },
      data: {
        content: JSON.stringify(updatedData),
        metadata: newMetadata as any // Type assertion for Prisma JsonValue compatibility
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating lead scores:', error);
    return false;
  }
}

  // Health check for Apollo API
  async checkApolloApiHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    rateLimitRemaining?: number;
    lastError?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apolloApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          per_page: 1,
          page: 1,
          person_titles: ['CEO'],
          person_locations: ['United States']
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
          rateLimitRemaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
        };
      } else if (response.status === 429) {
        return {
          status: 'degraded',
          responseTime,
          lastError: 'Rate limit exceeded'
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          lastError: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export the enhanced service
export { EnhancedGlobalApolloService as ApolloLeadService };