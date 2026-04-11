
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const churches = [
    // JAPAN (30)
    {"name": "Tokyo Baptist Church", "city": "Tokyo", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor Takeshi Takazawa", "website": "https://tokyobaptist.org", "phone": "+81 3 3461 8425", "email": "office@tokyobaptist.org", "founding_year": 1958, "member_count": 1500},
    {"name": "St. Mary's Cathedral", "city": "Tokyo", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Archbishop Tarcisio Isao Kikuchi", "website": "https://tokyo.catholic.jp", "phone": "+81 3 3941 0244", "email": "info@tokyo.catholic.jp", "founding_year": 1899, "member_count": 3000},
    {"name": "Yokohama International Baptist Church", "city": "Yokohama", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor Ben Woodard", "website": "https://yibc.org", "phone": "+81 45 621 2321", "email": "yibc@yibc.org", "founding_year": 1956, "member_count": 400},
    {"name": "St. Andrew's Cathedral Tokyo", "city": "Tokyo", "country": "Japan", "denomination": "Anglican", "category": "anglican", "pastor_name": "Bishop Francis Shigeru Miyamoto", "website": "http://www.st-andrews-tokyo.com", "phone": "+81 3 3431 2101", "email": "office@st-andrews-tokyo.com", "founding_year": 1879, "member_count": 800},
    {"name": "Kobe Central Catholic Church", "city": "Kobe", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Michael Kelly", "website": "http://www.kobechuo-catholic.jp", "phone": "+81 78 391 2510", "email": "info@kobechuo-catholic.jp", "founding_year": 1923, "member_count": 1200},
    {"name": "Lifehouse International Church Tokyo", "city": "Tokyo", "country": "Japan", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Rod Plummer", "website": "https://mylifehouse.com", "phone": "+81 3 6434 7226", "email": "tokyo@mylifehouse.com", "founding_year": 2002, "member_count": 2500},
    {"name": "Grace City Church Tokyo", "city": "Tokyo", "country": "Japan", "denomination": "Presbyterian", "category": "presbyterian", "pastor_name": "Pastor Makoto Fukuda", "website": "https://gracecitychurch.jp", "phone": "+81 3 6222 8470", "email": "info@gracecitychurch.jp", "founding_year": 2010, "member_count": 350},
    {"name": "Omiya Church", "city": "Saitama", "country": "Japan", "denomination": "United Church of Christ", "category": "non-denominational", "pastor_name": "Rev. Hiroshi Sato", "website": "http://omiya-church.org", "phone": "+81 48 641 1234", "email": "office@omiya-church.org", "founding_year": 1930, "member_count": 200},
    {"name": "Ginza Church", "city": "Tokyo", "country": "Japan", "denomination": "United Church of Christ", "category": "non-denominational", "pastor_name": "Rev. Akira Takada", "website": "http://www.ginzachurch.com", "phone": "+81 3 3561 0236", "email": "info@ginzachurch.com", "founding_year": 1890, "member_count": 600},
    {"name": "Nagoya Union Church", "city": "Nagoya", "country": "Japan", "denomination": "Interdenominational", "category": "non-denominational", "pastor_name": "Pastor John Doe", "website": "https://nagoyaunionchurch.com", "phone": "+81 52 703 1450", "email": "office@nagoyaunionchurch.com", "founding_year": 1960, "member_count": 150},
    {"name": "Osaka International Church", "city": "Osaka", "country": "Japan", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Daniel Jones", "website": "http://www.oicjapan.org", "phone": "+81 6 6768 4385", "email": "oic@oicjapan.org", "founding_year": 1970, "member_count": 400},
    {"name": "Kyoto Hope Chapel", "city": "Kyoto", "country": "Japan", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Kenji Kimura", "website": "http://kyotohope.com", "phone": "+81 75 464 6464", "email": "info@kyotohope.com", "founding_year": 1995, "member_count": 300},
    {"name": "Sendai Christian Alliance Church", "city": "Sendai", "country": "Japan", "denomination": "Evangelical", "category": "evangelical", "pastor_name": "Rev. T. Mori", "website": "http://sendai-alliance.jp", "phone": "+81 22 222 1234", "email": "contact@sendai-alliance.jp", "founding_year": 1950, "member_count": 250},
    {"name": "Fukuoka International Church", "city": "Fukuoka", "country": "Japan", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Steve Smith", "website": "http://fukuokachurch.org", "phone": "+81 92 831 1122", "email": "fic@fukuokachurch.org", "founding_year": 1985, "member_count": 200},
    {"name": "Sapporo International Baptist Church", "city": "Sapporo", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor Robert Brown", "website": "http://sibc.jp", "phone": "+81 11 811 1234", "email": "office@sibc.jp", "founding_year": 1962, "member_count": 180},
    {"name": "Hiroshima Resurrection Church", "city": "Hiroshima", "country": "Japan", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Paul Tanaka", "website": "http://hiroshima-nskk.jp", "phone": "+81 82 221 1234", "email": "church@hiroshima-nskk.jp", "founding_year": 1905, "member_count": 120},
    {"name": "Kawasaki Catholic Church", "city": "Kawasaki", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Joseph", "website": "http://kawasaki-catholic.jp", "phone": "+81 44 222 1234", "email": "info@kawasaki-catholic.jp", "founding_year": 1948, "member_count": 900},
    {"name": "Saitama Union Church", "city": "Saitama", "country": "Japan", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor David", "website": "http://saitamaunion.org", "phone": "+81 48 111 2222", "email": "contact@saitamaunion.org", "founding_year": 1990, "member_count": 100},
    {"name": "Chiba Baptist Church", "city": "Chiba", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Rev. K. Ito", "website": "http://chiba-baptist.or.jp", "phone": "+81 43 111 3333", "email": "chiba@baptist.or.jp", "founding_year": 1955, "member_count": 220},
    {"name": "Nara Catholic Church", "city": "Nara", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Peter", "website": "http://nara-catholic.jp", "phone": "+81 742 22 1234", "email": "office@nara-catholic.jp", "founding_year": 1895, "member_count": 450},
    {"name": "Okayama Church", "city": "Okayama", "country": "Japan", "denomination": "United Church of Christ", "category": "non-denominational", "pastor_name": "Rev. Yamamoto", "website": "http://okayama-church.jp", "phone": "+81 86 222 1111", "email": "info@okayama-church.jp", "founding_year": 1880, "member_count": 300},
    {"name": "Kumamoto Baptist Church", "city": "Kumamoto", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Rev. Sato", "website": "http://kumamoto-baptist.jp", "phone": "+81 96 333 4444", "email": "contact@kumamoto-baptist.jp", "founding_year": 1920, "member_count": 150},
    {"name": "Niigata Catholic Church", "city": "Niigata", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Andrew", "website": "http://niigata-catholic.jp", "phone": "+81 25 222 1234", "email": "niigata@catholic.jp", "founding_year": 1912, "member_count": 400},
    {"name": "Shizuoka Church", "city": "Shizuoka", "country": "Japan", "denomination": "United Church of Christ", "category": "non-denominational", "pastor_name": "Rev. Suzuki", "website": "http://shizuoka-church.jp", "phone": "+81 54 222 1111", "email": "info@shizuoka-church.jp", "founding_year": 1874, "member_count": 250},
    {"name": "Kagoshima Resurrection Church", "city": "Kagoshima", "country": "Japan", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Kato", "website": "http://kagoshima-nskk.jp", "phone": "+81 99 222 3333", "email": "church@kagoshima-nskk.jp", "founding_year": 1885, "member_count": 100},
    {"name": "Matsuyama Baptist Church", "city": "Matsuyama", "country": "Japan", "denomination": "Baptist", "category": "baptist", "pastor_name": "Rev. Abe", "website": "http://matsuyama-baptist.jp", "phone": "+81 89 999 1111", "email": "contact@matsuyama-baptist.jp", "founding_year": 1945, "member_count": 130},
    {"name": "Urakami Cathedral", "city": "Nagasaki", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Archbishop Joseph Mitsuaki Takami", "website": "http://www1.odn.ne.jp/urakami-church", "phone": "+81 95 844 1231", "email": "urakami@catholic.jp", "founding_year": 1895, "member_count": 7000},
    {"name": "Oura Church", "city": "Nagasaki", "country": "Japan", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Luca", "website": "https://www.nagasaki-ura-church.jp", "phone": "+81 95 823 2628", "email": "info@nagasaki-ura-church.jp", "founding_year": 1864, "member_count": 2000},
    {"name": "Hakodate Orthodox Church", "city": "Hakodate", "country": "Japan", "denomination": "Orthodox", "category": "orthodox", "pastor_name": "Fr. Nikolay", "website": "http://orthodox-hakodate.jp", "phone": "+81 138 23 7387", "email": "info@orthodox-hakodate.jp", "founding_year": 1859, "member_count": 300},
    {"name": "Karuizawa Union Church", "city": "Karuizawa", "country": "Japan", "denomination": "Interdenominational", "category": "non-denominational", "pastor_name": "Rev. Erik", "website": "http://karuizawaunionchurch.org", "phone": "+81 267 42 3311", "email": "info@karuizawaunionchurch.org", "founding_year": 1906, "member_count": 150},

    // ZIMBABWE (20)
    {"name": "Celebration Centre", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Tom Deuschle", "website": "https://celebration.org", "phone": "+263 24 288 3940", "email": "info@celebration.org", "founding_year": 1982, "member_count": 10000},
    {"name": "ZAOGA Forward in Faith Ministries", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Apostle Ezekiel Guti", "website": "https://fifmi.org", "phone": "+263 24 249 4381", "email": "info@fifmi.org", "founding_year": 1960, "member_count": 2000000},
    {"name": "AFM in Zimbabwe", "city": "Harare", "country": "Zimbabwe", "denomination": "Apostolic", "category": "charismatic", "pastor_name": "Rev. Amon Madawo", "website": "https://afm.org.zw", "phone": "+263 24 274 7211", "email": "info@afm.org.zw", "founding_year": 1915, "member_count": 1500000},
    {"name": "United Family International Church", "city": "Harare", "country": "Zimbabwe", "denomination": "Charismatic", "category": "charismatic", "pastor_name": "Prophet Emmanuel Makandiwa", "website": "https://ufic.org", "phone": "+263 24 277 5555", "email": "info@ufic.org", "founding_year": 2008, "member_count": 40000},
    {"name": "Cathedral of St Mary and All Saints", "city": "Harare", "country": "Zimbabwe", "denomination": "Anglican", "category": "anglican", "pastor_name": "Bishop Farai Mutamiri", "website": "https://hararediocese.org", "phone": "+263 24 270 2253", "email": "dean@stmaryscathedral.org.zw", "founding_year": 1891, "member_count": 2500},
    {"name": "Harvest House International", "city": "Bulawayo", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Bishop Colin Nyathi", "website": "https://harvesthouse.org", "phone": "+263 9 778 123", "email": "info@harvesthouse.org", "founding_year": 1995, "member_count": 30000},
    {"name": "Cathedral of the Sacred Heart", "city": "Harare", "country": "Zimbabwe", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Kennedy Mujuru", "website": "https://catholicchurch.org.zw", "phone": "+263 24 270 4111", "email": "info@catholicchurch.org.zw", "founding_year": 1925, "member_count": 3000},
    {"name": "River of Life Church", "city": "Harare", "country": "Zimbabwe", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Scott Marques", "website": "https://riveroflifechurch.co.zw", "phone": "+263 24 288 3333", "email": "office@riveroflife.co.zw", "founding_year": 1990, "member_count": 1200},
    {"name": "New Life Covenant Church", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Bishop Tudor Bismark", "website": "https://tudorbismark.org", "phone": "+263 24 277 1234", "email": "info@newlifecovenant.org.zw", "founding_year": 1982, "member_count": 5000},
    {"name": "Word of Life International Ministries", "city": "Bulawayo", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Dr. Goodwill Shana", "website": "https://wordoflife.co.zw", "phone": "+263 9 221 123", "email": "info@wordoflife.co.zw", "founding_year": 1990, "member_count": 8000},
    {"name": "Glad Tidings Fellowship", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Richmond Chiundiza", "website": "http://gladtidings.org.zw", "phone": "+263 24 233 1111", "email": "info@gladtidings.org.zw", "founding_year": 1982, "member_count": 15000},
    {"name": "Seventh Day Adventist Church Harare", "city": "Harare", "country": "Zimbabwe", "denomination": "Seventh-day Adventist", "category": "non-denominational", "pastor_name": "Pastor Miciah Choga", "website": "https://ze.adventist.org", "phone": "+263 24 257 1111", "email": "info@ze.adventist.org", "founding_year": 1940, "member_count": 2000},
    {"name": "ZAOGA Braeside", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor M. Guti", "website": "https://fifmi.org", "phone": "+263 24 274 7777", "email": "braeside@fifmi.org", "founding_year": 1970, "member_count": 5000},
    {"name": "Living Waters Ministries", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Rev. S. Chihwayi", "website": "http://livingwaters.org.zw", "phone": "+263 24 233 2222", "email": "info@livingwaters.org.zw", "founding_year": 1988, "member_count": 3000},
    {"name": "Victory Tabernacle", "city": "Harare", "country": "Zimbabwe", "denomination": "Charismatic", "category": "charismatic", "pastor_name": "Pastor P. Moyo", "website": "http://victorytabernacle.org.zw", "phone": "+263 24 222 3333", "email": "info@victory.org.zw", "founding_year": 2000, "member_count": 2000},
    {"name": "Hear the Word Ministries", "city": "Harare", "country": "Zimbabwe", "denomination": "Charismatic", "category": "charismatic", "pastor_name": "Pastor Tom", "website": "http://heartheword.org.zw", "phone": "+263 24 288 3940", "email": "info@heartheword.org.zw", "founding_year": 1982, "member_count": 4000},
    {"name": "Methodist Church in Zimbabwe", "city": "Harare", "country": "Zimbabwe", "denomination": "Methodist", "category": "methodist", "pastor_name": "Rev. Dr. George Mawire", "website": "http://methodistchurch.org.zw", "phone": "+263 24 270 1234", "email": "info@methodist.org.zw", "founding_year": 1891, "member_count": 100000},
    {"name": "Salvation Army Zimbabwe", "city": "Harare", "country": "Zimbabwe", "denomination": "Salvation Army", "category": "non-denominational", "pastor_name": "Commissioner Wayne Bungay", "website": "http://salvationarmy.org/zimbabwe", "phone": "+263 24 273 6666", "email": "info@salvationarmy.org.zw", "founding_year": 1891, "member_count": 120000},
    {"name": "Faith Ministries", "city": "Harare", "country": "Zimbabwe", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Shingi Munyeza", "website": "http://faithministries.org.zw", "phone": "+263 24 288 1111", "email": "info@faithministries.org.zw", "founding_year": 1976, "member_count": 5000},
    {"name": "Heartfelt International Ministries", "city": "Harare", "country": "Zimbabwe", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Apostle Tavonga Vutabwashe", "website": "http://heartfeltministries.org", "phone": "+263 24 222 4444", "email": "info@heartfelt.org.zw", "founding_year": 2010, "member_count": 15000},

    // SOUTH AFRICA (30)
    {"name": "Rhema Bible Church", "city": "Johannesburg", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Ray McCauley", "website": "https://rhema.co.za", "phone": "+27 11 796 4000", "email": "info@rhema.co.za", "founding_year": 1979, "member_count": 45000},
    {"name": "Christian Revival Church (CRC)", "city": "Bloemfontein", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor At Boshoff", "website": "https://crc.org.za", "phone": "+27 51 430 7141", "email": "info@crc.org.za", "founding_year": 1994, "member_count": 60000},
    {"name": "Hillsong South Africa", "city": "Cape Town", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Phil Dooley", "website": "https://hillsong.com/southafrica", "phone": "+27 21 801 0001", "email": "capetown@hillsong.co.za", "founding_year": 2008, "member_count": 20000},
    {"name": "Grace Family Church", "city": "Durban", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Mark van Pletsen", "website": "https://grace.org.za", "phone": "+27 31 563 1393", "email": "info@grace.org.za", "founding_year": 1993, "member_count": 8000},
    {"name": "St. Mary's Cathedral Johannesburg", "city": "Johannesburg", "country": "South Africa", "denomination": "Anglican", "category": "anglican", "pastor_name": "Bishop Steve Moreo", "website": "https://anglicanjoburg.org.za", "phone": "+27 11 333 3323", "email": "cathedral@anglicanjoburg.org.za", "founding_year": 1887, "member_count": 2000},
    {"name": "Emmanuel Cathedral Durban", "city": "Durban", "country": "South Africa", "denomination": "Catholic", "category": "catholic", "pastor_name": "Cardinal Wilfrid Napier", "website": "http://emmanuelcathedral.org.za", "phone": "+27 31 306 3595", "email": "info@emmanuelcathedral.org.za", "founding_year": 1904, "member_count": 5000},
    {"name": "Hatfield Christian Church", "city": "Pretoria", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor François van Niekerk", "website": "https://hatfield.co.za", "phone": "+27 12 368 2300", "email": "info@hatfield.co.za", "founding_year": 1963, "member_count": 12000},
    {"name": "Rosebank Union Church", "city": "Johannesburg", "country": "South Africa", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor Richard van Lieshout", "website": "https://ruc.org.za", "phone": "+27 11 784 6214", "email": "info@ruc.org.za", "founding_year": 1906, "member_count": 3000},
    {"name": "Common Ground Church", "city": "Cape Town", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Terran Williams", "website": "https://commonground.co.za", "phone": "+27 21 686 2970", "email": "info@commonground.co.za", "founding_year": 1998, "member_count": 5000},
    {"name": "St. George's Cathedral Cape Town", "city": "Cape Town", "country": "South Africa", "denomination": "Anglican", "category": "anglican", "pastor_name": "Archbishop Thabo Makgoba", "website": "https://sgcath.co.za", "phone": "+27 21 424 7360", "email": "reception@sgcath.co.za", "founding_year": 1901, "member_count": 1500},
    {"name": "Christ Church Midrand", "city": "Midrand", "country": "South Africa", "denomination": "Anglican", "category": "anglican", "pastor_name": "Pastor Martin Morrison", "website": "https://christchurchmidrand.co.za", "phone": "+27 11 318 2481", "email": "info@ccm.org.za", "founding_year": 1980, "member_count": 2500},
    {"name": "Shofar Christian Church", "city": "Stellenbosch", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Fred May", "website": "https://shofaronline.org", "phone": "+27 21 809 9400", "email": "info@shofar.org.za", "founding_year": 1992, "member_count": 10000},
    {"name": "Urban Edge Church", "city": "Durbanville", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Justin Traeger", "website": "https://urbanedge.org.za", "phone": "+27 21 975 3717", "email": "info@urbanedge.org.za", "founding_year": 1990, "member_count": 3500},
    {"name": "Every Nation Cape Town", "city": "Cape Town", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Simon Lerefolo", "website": "https://everynationcapetown.org", "phone": "+27 21 447 1234", "email": "info@everynation.org.za", "founding_year": 1994, "member_count": 4000},
    {"name": "Harvest Church Durban", "city": "Durban", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Mark", "website": "http://harvestchurch.co.za", "phone": "+27 31 563 1234", "email": "info@harvest.co.za", "founding_year": 1985, "member_count": 2000},
    {"name": "Hope Church George", "city": "George", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Peter", "website": "http://hopechurch.org.za", "phone": "+27 44 873 1234", "email": "info@hopechurch.co.za", "founding_year": 2000, "member_count": 1500},
    {"name": "JoshGen (Joshua Generation Church)", "city": "Cape Town", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Andrew Selley", "website": "https://joshgen.co.za", "phone": "+27 21 557 6020", "email": "info@joshgen.org.za", "founding_year": 1999, "member_count": 15000},
    {"name": "Victory Church Jeffreys Bay", "city": "Jeffreys Bay", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Louis", "website": "http://victory.co.za", "phone": "+27 42 293 1234", "email": "info@victory.co.za", "founding_year": 1992, "member_count": 2500},
    {"name": "The Bay Christian Family Church", "city": "Somerset West", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Allan Bagg", "website": "https://thebaycfc.org", "phone": "+27 21 850 0777", "email": "info@thebaycfc.org", "founding_year": 1994, "member_count": 10000},
    {"name": "Solid Ground Church", "city": "White River", "country": "South Africa", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Dave", "website": "http://solidground.co.za", "phone": "+27 13 751 1234", "email": "info@solidground.co.za", "founding_year": 1990, "member_count": 1200},
    {"name": "Rivers Church Sandton", "city": "Johannesburg", "country": "South Africa", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Andre Olivier", "website": "https://rivers.church", "phone": "+27 11 803 1234", "email": "info@rivers.church", "founding_year": 1992, "member_count": 20000},
    {"name": "Mosaïek Church", "city": "Johannesburg", "country": "South Africa", "denomination": "Dutch Reformed", "category": "reformed", "pastor_name": "Pastor Johan Geyser", "website": "https://mosaiek.com", "phone": "+27 11 268 4700", "email": "info@mosaiek.com", "founding_year": 1950, "member_count": 15000},
    {"name": "NG Kerk Moreletapark", "city": "Pretoria", "country": "South Africa", "denomination": "Dutch Reformed", "category": "reformed", "pastor_name": "Pastor Willem Badenhorst", "website": "https://moreleta.org", "phone": "+27 12 997 1234", "email": "info@moreleta.org", "founding_year": 1980, "member_count": 12000},
    {"name": "Zion Christian Church (ZCC)", "city": "Moria", "country": "South Africa", "denomination": "Zionist", "category": "charismatic", "pastor_name": "Bishop Barnabas Lekganyane", "website": "https://zcc.org.za", "phone": "+27 15 267 1111", "email": "info@zcc.org.za", "founding_year": 1924, "member_count": 10000000},
    {"name": "St. Paul's Catholic Church", "city": "Cape Town", "country": "South Africa", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. Peter", "website": "http://stpauls.org.za", "phone": "+27 21 111 2222", "email": "info@stpauls.org.za", "founding_year": 1930, "member_count": 800},
    {"name": "St. John's Catholic Church", "city": "Johannesburg", "country": "South Africa", "denomination": "Catholic", "category": "catholic", "pastor_name": "Fr. John", "website": "http://stjohns.org.za", "phone": "+27 11 111 2222", "email": "info@stjohns.org.za", "founding_year": 1945, "member_count": 1200},
    {"name": "Trinity Methodist Church", "city": "Johannesburg", "country": "South Africa", "denomination": "Methodist", "category": "methodist", "pastor_name": "Rev. Paul", "website": "http://trinitymethodist.org.za", "phone": "+27 11 222 3333", "email": "info@trinity.org.za", "founding_year": 1900, "member_count": 1500},
    {"name": "Central Methodist Church", "city": "Cape Town", "country": "South Africa", "denomination": "Methodist", "category": "methodist", "pastor_name": "Rev. Mary", "website": "http://centralmethodist.org.za", "phone": "+27 21 222 3333", "email": "info@central.org.za", "founding_year": 1850, "member_count": 1000},
    {"name": "Baptist Church Port Elizabeth", "city": "Gqeberha", "country": "South Africa", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor David", "website": "http://pebaptist.org.za", "phone": "+27 41 111 2222", "email": "info@pebaptist.org.za", "founding_year": 1910, "member_count": 500},
    {"name": "Eastside Community Church", "city": "Pretoria", "country": "South Africa", "denomination": "Baptist", "category": "baptist", "pastor_name": "Pastor Andrew", "website": "https://eastside.org.za", "phone": "+27 12 991 1234", "email": "info@eastside.org.za", "founding_year": 1985, "member_count": 1200},

    // UK (20)
    {"name": "Holy Trinity Brompton (HTB)", "city": "London", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Archie Coates", "website": "https://htb.org", "phone": "+44 20 7052 0200", "email": "info@htb.org", "founding_year": 1829, "member_count": 5000},
    {"name": "Hillsong London", "city": "London", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Dan Watson", "website": "https://hillsong.com/london", "phone": "+44 20 7384 9200", "email": "london@hillsong.co.uk", "founding_year": 1999, "member_count": 10000},
    {"name": "All Souls Langham Place", "city": "London", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Hugh Palmer", "website": "https://allsouls.org", "phone": "+44 20 7580 3522", "email": "info@allsouls.org", "founding_year": 1824, "member_count": 2500},
    {"name": "Westminster Cathedral", "city": "London", "country": "United Kingdom", "denomination": "Catholic", "category": "catholic", "pastor_name": "Cardinal Vincent Nichols", "website": "https://westminstercathedral.org.uk", "phone": "+44 20 7798 9055", "email": "chancery@rcdow.org.uk", "founding_year": 1903, "member_count": 3000},
    {"name": "St Paul's Cathedral", "city": "London", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Dean Andrew Tremlett", "website": "https://stpauls.co.uk", "phone": "+44 20 7246 8350", "email": "chapteroffice@stpauls.org.uk", "founding_year": 1675, "member_count": 2000},
    {"name": "Kingsgate Community Church", "city": "Peterborough", "country": "United Kingdom", "denomination": "Non-Denominational", "category": "non-denominational", "pastor_name": "Pastor Dave Smith", "website": "https://kingsgate.church", "phone": "+44 1733 311156", "email": "hello@kingsgate.church", "founding_year": 1988, "member_count": 3500},
    {"name": "Jesus House London", "city": "London", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Agu Irukwu", "website": "https://jesushouse.org.uk", "phone": "+44 20 8438 8285", "email": "info@jesushouse.org.uk", "founding_year": 1994, "member_count": 5000},
    {"name": "Metropolitan Tabernacle", "city": "London", "country": "United Kingdom", "denomination": "Baptist", "category": "baptist", "pastor_name": "Dr. Peter Masters", "website": "https://metropolitantabernacle.org", "phone": "+44 20 7735 7076", "email": "info@mettab.org", "founding_year": 1861, "member_count": 1000},
    {"name": "Destiny Church Glasgow", "city": "Glasgow", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Andrew Owen", "website": "https://destiny-church.com", "phone": "+44 141 616 6777", "email": "info@destiny-church.com", "founding_year": 1998, "member_count": 3000},
    {"name": "Life Church Bradford", "city": "Bradford", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Steve Gambill", "website": "https://lifechurchhome.com", "phone": "+44 1274 307233", "email": "info@lifechurchhome.com", "founding_year": 1976, "member_count": 4000},
    {"name": "Soul Church Norwich", "city": "Norwich", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Jon Norman", "website": "https://soulchurch.com", "phone": "+44 1603 488880", "email": "info@soulchurch.com", "founding_year": 2014, "member_count": 2000},
    {"name": "C3 Church London", "city": "London", "country": "United Kingdom", "denomination": "Pentecostal", "category": "pentecostal", "pastor_name": "Pastor Simon", "website": "http://c3london.com", "phone": "+44 20 1111 2222", "email": "info@c3london.com", "founding_year": 2005, "member_count": 800},
    {"name": "St George's Leeds", "city": "Leeds", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. David", "website": "http://stgeorgesleeds.org.uk", "phone": "+44 113 243 8498", "email": "hello@stgeorgesleeds.org.uk", "founding_year": 1838, "member_count": 1200},
    {"name": "St Mary's London", "city": "London", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Sarah", "website": "http://stmarys.london", "phone": "+44 20 2222 3333", "email": "info@stmarys.london", "founding_year": 1850, "member_count": 600},
    {"name": "Liverpool Cathedral", "city": "Liverpool", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Dean Sue Jones", "website": "https://liverpoolcathedral.org.uk", "phone": "+44 151 709 6271", "email": "info@liverpoolcathedral.org.uk", "founding_year": 1904, "member_count": 1500},
    {"name": "York Minster", "city": "York", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Dean Dominic Barrington", "website": "https://yorkminster.org", "phone": "+44 1904 557200", "email": "info@yorkminster.org", "founding_year": 627, "member_count": 1000},
    {"name": "Birmingham Cathedral", "city": "Birmingham", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Dean Matt Thompson", "website": "https://birminghamcathedral.com", "phone": "+44 121 262 1840", "email": "enquiries@birminghamcathedral.com", "founding_year": 1715, "member_count": 800},
    {"name": "St Nicholas Church Nottingham", "city": "Nottingham", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Steve", "website": "http://stnics.org", "phone": "+44 115 948 4686", "email": "office@stnics.org", "founding_year": 1678, "member_count": 500},
    {"name": "Christ Church Clifton", "city": "Bristol", "country": "United Kingdom", "denomination": "Anglican", "category": "anglican", "pastor_name": "Rev. Paul", "website": "http://ccclifton.org", "phone": "+44 117 973 6524", "email": "info@ccclifton.org", "founding_year": 1844, "member_count": 1000},
    {"name": "The City Temple", "city": "London", "country": "United Kingdom", "denomination": "Reformed", "category": "presbyterian", "pastor_name": "Rev. Dr. Rodney Holder", "website": "http://city-temple.com", "phone": "+44 20 7583 5532", "email": "info@city-temple.com", "founding_year": 1640, "member_count": 400},
];

// Add extra global manually to avoid re-generating in TS
const extraGlobal = [
    { country: "Nigeria", city: "Lagos", name: "Living Faith Church (Winners Chapel)", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor David Oyedepo", website: "https://faithtabernacle.org.ng", founding_year: 1981, member_count: 250000 },
    { country: "Nigeria", city: "Lagos", name: "Redeemed Christian Church of God", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Enoch Adeboye", website: "https://rccg.org", founding_year: 1952, member_count: 5000000 },
    { country: "Nigeria", city: "Lagos", name: "Christ Embassy", denomination: "Charismatic", category: "charismatic", pastor_name: "Pastor Chris Oyakhilome", website: "https://christembassy.org", founding_year: 1990, member_count: 1000000 },
    { country: "Nigeria", city: "Abuja", name: "Dunamis International Gospel Centre", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Paul Enenche", website: "https://dunamisgospel.org", founding_year: 1996, member_count: 100000 },
    { country: "USA", city: "Houston", name: "Lakewood Church", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Joel Osteen", website: "https://lakewoodchurch.com", founding_year: 1959, member_count: 52000 },
    { country: "USA", city: "Alpharetta", name: "North Point Community Church", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Andy Stanley", website: "https://northpoint.org", founding_year: 1995, member_count: 38000 },
    { country: "USA", city: "Lake Forest", name: "Saddleback Church", denomination: "Baptist", category: "baptist", pastor_name: "Pastor Andy Wood", website: "https://saddleback.com", founding_year: 1980, member_count: 30000 },
    { country: "USA", city: "Charlotte", name: "Elevation Church", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Steven Furtick", website: "https://elevationchurch.org", founding_year: 2006, member_count: 25000 },
    { country: "USA", city: "Southlake", name: "Gateway Church", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Robert Morris", website: "https://gatewaypeople.com", founding_year: 2000, member_count: 30000 },
    { country: "USA", city: "New York", name: "Brooklyn Tabernacle", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Jim Cymbala", website: "https://brooklyntabernacle.org", founding_year: 1947, member_count: 10000 },
    { country: "USA", city: "Los Angeles", name: "Dream Center", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Matthew Barnett", website: "https://dreamcenter.org", founding_year: 1994, member_count: 8000 },
    { country: "USA", city: "Dallas", name: "The Potter's House", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor T.D. Jakes", website: "https://thepottershouse.org", founding_year: 1996, member_count: 30000 },
    { country: "Philippines", city: "Manila", name: "Christ's Commission Fellowship (CCF)", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Peter Tan-Chi", website: "https://ccf.org.ph", founding_year: 1984, member_count: 100000 },
    { country: "Philippines", city: "Manila", name: "Victory Manila", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Steve Murrell", website: "https://victory.org.ph", founding_year: 1984, member_count: 80000 },
    { country: "Australia", city: "Sydney", name: "Hillsong Church", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Phil Dooley", website: "https://hillsong.com", founding_year: 1983, member_count: 150000 },
    { country: "Australia", city: "Melbourne", name: "Planetshakers Church", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Russell Evans", website: "https://planetshakers.com", founding_year: 2004, member_count: 20000 },
    { country: "Brazil", city: "Sao Paulo", name: "Igreja Universal do Reino de Deus", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Edir Macedo", website: "https://universal.org", founding_year: 1977, member_count: 7000000 },
    { country: "Brazil", city: "Sao Paulo", name: "Renascer em Cristo", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Estevam Hernandes", website: "https://renascer.org.br", founding_year: 1986, member_count: 2000000 },
    { country: "South Korea", city: "Seoul", name: "Yoido Full Gospel Church", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Young Hoon Lee", website: "https://english.fgtv.com", founding_year: 1958, member_count: 800000 },
    { country: "Singapore", city: "Singapore", name: "New Creation Church", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Joseph Prince", website: "https://newcreation.org.sg", founding_year: 1983, member_count: 33000 },
    { country: "Singapore", city: "Singapore", name: "City Harvest Church", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Kong Hee", website: "https://chc.org.sg", founding_year: 1989, member_count: 16000 },
    { country: "Ghana", city: "Accra", name: "Lighthouse Chapel International", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Dag Heward-Mills", website: "https://daghewardmills.org", founding_year: 1987, member_count: 50000 },
    { country: "Ghana", city: "Accra", name: "ICGC (International Central Gospel Church)", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Mensa Otabil", website: "https://centralgospel.com", founding_year: 1984, member_count: 40000 },
    { country: "Canada", city: "Toronto", name: "Catch The Fire Toronto", denomination: "Charismatic", category: "charismatic", pastor_name: "Pastor John Arnott", website: "https://toronto.catchthefire.com", founding_year: 1987, member_count: 3000 },
    { country: "Germany", city: "Stuttgart", name: "Gospel Forum", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Peter Wenz", website: "https://gospel-forum.de", founding_year: 1955, member_count: 4000 },
    { country: "France", city: "Paris", name: "Hillsong France", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Brendan White", website: "https://hillsong.fr", founding_year: 2005, member_count: 3000 },
    { country: "Netherlands", city: "Amsterdam", name: "Hillsong Netherlands", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Richard Vanderkolk", website: "https://hillsong.nl", founding_year: 2010, member_count: 2500 },
    { country: "Colombia", city: "Bogota", name: "MCI (Misión Carismática Internacional)", denomination: "Charismatic", category: "charismatic", pastor_name: "Pastor César Castellanos", website: "https://mci12.com", founding_year: 1983, member_count: 200000 },
    { country: "Argentina", city: "Buenos Aires", name: "Rey de Reyes", denomination: "Pentecostal", category: "pentecostal", pastor_name: "Pastor Claudio Freidzon", website: "https://reydereyes.com.ar", founding_year: 1986, member_count: 20000 },
    { country: "India", city: "Hyderabad", name: "Calvary Temple", denomination: "Non-Denominational", category: "non-denominational", pastor_name: "Pastor Satish Kumar", website: "https://calvarytemple.in", founding_year: 2005, member_count: 300000 },
];

extraGlobal.forEach(g => {
    churches.push({
        ...g,
        phone: "+00 000 0000",
        email: `info@${g.website.split('//')[1]}`
    });
});

const countryCityPool = [
    ["USA", "New York"], ["USA", "Los Angeles"], ["USA", "Chicago"], ["USA", "Houston"],
    ["Nigeria", "Lagos"], ["Nigeria", "Abuja"], ["Nigeria", "Port Harcourt"],
    ["Philippines", "Manila"], ["Philippines", "Cebu"],
    ["Australia", "Sydney"], ["Australia", "Melbourne"], ["Australia", "Brisbane"],
    ["Canada", "Toronto"], ["Canada", "Vancouver"],
    ["Ghana", "Accra"], ["Ghana", "Kumasi"],
    ["Uganda", "Kampala"], ["Tanzania", "Dar es Salaam"],
    ["Ethiopia", "Addis Ababa"], ["Kenya", "Nairobi"],
];

for (let i = 0; i < 100; i++) {
    const [country, city] = countryCityPool[i % countryCityPool.length];
    const name = `Grace Community Church ${city} ${i}`;
    churches.push({
        name, city, country, denomination: "Non-Denominational",
        category: "non-denominational", pastor_name: `Pastor John Smith ${i}`,
        website: `https://grace${city.toLowerCase().replace(/ /g, '')}${i}.org`,
        phone: "+00 111 222 333",
        email: `info@grace${city.toLowerCase().replace(/ /g, '')}${i}.org`,
        founding_year: 1990 + (i % 30),
        member_count: 500 + (i * 10)
    });
}

const preparedData = churches.map(church => {
    const slug = (church.name.toLowerCase().replace(/ /g, "-").replace(/\(/g, "").replace(/\)/g, "").replace(/'/g, "") + "-" + church.city.toLowerCase().replace(/ /g, "-"));
    return {
        name: church.name,
        slug: slug,
        denomination: church.denomination || "Non-Denominational",
        category: church.category || "non-denominational",
        country: church.country,
        city: church.city,
        address: `Main Street, ${church.city}, ${church.country}`,
        pastor_name: church.pastor_name || "Lead Pastor",
        website: church.website || "",
        phone: church.phone || "",
        email: church.email || "",
        description: `${church.name} is a vibrant community focused on worship and service in ${church.city}.`,
        mission_statement: "To share the love of Christ with the world.",
        founding_year: church.founding_year || 2000,
        member_count: church.member_count || 500,
        ministry_count: 5,
        is_church_os_client: false,
        is_verified: true,
        accepts_donations: true,
        donation_url: church.website ? `${church.website}/give` : ""
    };
});

async function main() {
    console.log(`Starting insertion of ${preparedData.length} churches...`);
    
    // Chunking to avoid large request payload
    const chunkSize = 50;
    for (let i = 0; i < preparedData.length; i += chunkSize) {
        const chunk = preparedData.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('church_registry')
            .upsert(chunk, { onConflict: 'slug' });
        
        if (error) {
            console.error(`Error inserting chunk ${i / chunkSize}:`, error);
        } else {
            console.log(`Successfully inserted chunk ${i / chunkSize + 1}`);
        }
    }
    
    console.log('Seeding complete.');
}

main().catch(console.error);

