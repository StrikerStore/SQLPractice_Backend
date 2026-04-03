/**
 * Seeds databases: retail + hr (practice datasets) + sql_practice (curriculum meta).
 * Uses realistic, production-quality data instead of placeholders.
 * Run: npm run seed:dev  (from backend/)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { LEVELS, QUESTIONS } from './seed-questions.js';

dotenv.config();

const url = process.env.DATABASE_URL?.trim() || 'mysql://root:root@localhost:3306/';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function chunkInsert(
  conn: mysql.Connection,
  table: string,
  cols: string[],
  rows: unknown[][],
  chunk = 400,
) {
  const colList = cols.join(', ');
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const placeholders = part.map(() => `(${cols.map(() => '?').join(',')})`).join(',');
    await conn.query(`INSERT INTO ${table} (${colList}) VALUES ${placeholders}`, part.flat());
  }
}

// ─── Realistic data ────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua','Kenneth',
  'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna',
  'Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia',
  'Christopher','Ryan','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon',
  'Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Emma','Nicole','Helen',
  'Benjamin','Samuel','Patrick','Alexander','Jack','Dennis','Jerry','Tyler','Aaron','Henry',
  'Diana','Ruth','Virginia','Christine','Samantha','Rachel','Catherine','Janet','Frances','Alice',
  'Jacob','Gary','Adam','Nathan','Zachary','Kyle','Logan','Noah','Ethan','Mason',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Phillips','Evans','Turner','Parker','Collins','Edwards','Stewart','Morris','Bell','Gomez',
  'Kelly','Howard','Ward','Cox','Diaz','Richardson','Wood','Watson','Brooks','Bennett',
  'Gray','James','Reyes','Cruz','Hughes','Price','Myers','Long','Foster','Sanders',
  'Ross','Morales','Powell','Sullivan','Russell','Ortiz','Jenkins','Gutierrez','Perry','Butler',
  'Barnes','Fisher','Henderson','Coleman','Simmons','Patterson','Jordan','Reynolds','Hamilton','Graham',
];

const CITIES = [
  'New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego',
  'Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','San Francisco',
  'Indianapolis','Seattle','Denver','Nashville','Oklahoma City','El Paso','Washington','Boston',
  'Memphis','Louisville','Portland','Baltimore','Las Vegas','Milwaukee','Albuquerque','Tucson',
  'Fresno','Sacramento','Atlanta','Raleigh','Miami','Omaha','Cleveland','Tulsa',
  'Minneapolis','Tampa','New Orleans','Arlington','Wichita','Aurora','Bakersfield','Anaheim',
  'Santa Ana','Corpus Christi',
];

const EMAIL_DOMAINS = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com'];

const CATEGORY_NAMES = [
  'Electronics','Clothing & Apparel','Home & Kitchen','Sports & Outdoors',
  'Books & Media','Beauty & Health','Toys & Games','Food & Grocery',
  'Automotive','Office Supplies','Garden & Outdoor','Pet Supplies',
  'Musical Instruments','Arts & Crafts','Jewelry & Watches','Baby & Kids',
  'Travel & Luggage','Tools & Hardware','Video Games','Movies & Music',
];

// 12 realistic product names per category
const PRODUCT_NAMES: string[][] = [
  ['Wireless Noise-Cancelling Headphones','4K Smart TV 55"','Gaming Laptop 15.6"','Tablet 10" WiFi','True Wireless Earbuds','Mechanical Keyboard TKL','USB-C Hub 8-in-1','External SSD 1TB','Smart Watch GPS','Portable Bluetooth Speaker','Dash Cam Front & Rear 4K','HD Webcam 1080p'],
  ["Men's Classic Polo Shirt","Women's Running Jacket","Slim Fit Chinos","Floral Summer Dress","Athletic Socks 6-Pack","Genuine Leather Belt","Merino Wool Sweater","High-Waist Yoga Leggings","Denim Jacket Classic","Oxford Button-Down Shirt","Chelsea Ankle Boots","Pullover Hoodie Cotton"],
  ['Stainless Steel Cookware Set 12pc','Digital Air Fryer 5.8QT','Programmable Coffee Maker 12-Cup','6QT Stand Mixer','Non-Stick Skillet Set 3pc','6-in-1 Electric Pressure Cooker','High-Speed Blender 1200W','Convection Toaster Oven','11-Cup Food Processor','Rice Cooker & Steamer','Electric Gooseneck Kettle','Professional Knife Block Set 15pc'],
  ["Men's Road Running Shoes","Thick Yoga Mat 6mm","Adjustable Dumbbell Set 50lb","Resistance Bands Set 11pc","Cycling Safety Helmet","Official Size Basketball","Pro Tennis Racket","Hiking Backpack 40L","High-Density Foam Roller","Speed Jump Rope Pro","Doorway Pull-Up Bar","GPS Fitness Tracker Band"],
  ['The SQL Performance Guide','Data Engineering Handbook','Python Crash Course 3rd Ed','Good Strategy Bad Strategy','Foundation Trilogy Boxed Set','Manga Complete Collection Vol 1-10','World Cuisines Recipe Book','Rich Dad Poor Dad','Chip War: The Fight for Semiconductors','Kids STEM Experiment Kit','Complete Mystery Box Set','Atomic Habits'],
  ['Vitamin C + E Serum 1oz','Oil-Free Daily Moisturizer SPF30','Sonic Electric Toothbrush Pro','Biotin Shampoo & Conditioner Set','Mineral Sunscreen SPF 50','Floral Eau de Parfum 1.7oz',"Hydrating Lip Care Balm Set",'Collagen Sheet Mask 10pk','Beard Grooming & Trimming Kit','Professional Nail Care Kit 8pc','Lavender Essential Oil Set 10pc','Adult Daily Multivitamin Gummies 90ct'],
  ['LEGO City Police Station 2000pc','RC Off-Road Monster Truck','Catan Board Game Strategy','1000pc Puzzle Scenic Landscape','STEM Science Experiment Kit','Plush Stuffed Animals Gift Set','Premium Art & Craft Supply Kit','KidKraft Dollhouse with Furniture','Exploding Kittens Party Game','Classic Building Blocks 500pc','Super Soaker XL Water Blaster','Interactive Learning Tablet for Kids'],
  ['Colombian Arabica Ground Coffee 2lb','Dark Chocolate Variety Box 24pc','Premium Mixed Nuts 40oz','Extra Virgin Olive Oil 1L','RXBAR Protein Bar Variety 24pk','Instant Oatmeal Breakfast Bundle 48pk','Assorted Herbal Tea Box 6-Pack','Gourmet Hot Sauce Collection 6pk','Italian Pasta Variety Gift Set','Organic Dried Fruit & Nut Mix','Raw Manuka Honey 17.6oz','Healthy Snack Box Variety 45ct'],
  ['Magnetic Phone Mount Dashboard','Garmin Dash Cam 4K Front & Rear','NOCO Boost HD Jump Starter 2000A','Premium Car Seat Back Organizer','Digital Tire Pressure Gauge','Sylvania LED Headlight Bulbs H7 Pair','Handheld Car Vacuum Cordless','AAA Emergency Roadside Kit 76pc','Soft Grip Steering Wheel Cover','New Car Interior Air Freshener 24pk','Bluetooth OBD2 Diagnostic Scanner','WeatherTech All-Weather Floor Mats'],
  ['Anker 15W Wireless Charging Pad','Electric Height-Adjustable Standing Desk','Dual Monitor Arm Mount','Brother Label Maker P-Touch Cube','8-Sheet Micro-Cut Paper Shredder','Whiteboard Dry-Erase 36x24"','Bamboo Desk Organizer Set','Portable Document Scanner','Ergonomic Wrist Rest Mouse Pad','Heavy Duty Desktop Stapler','2-Drawer Lateral File Cabinet','Logitech HD Webcam C920 Pro'],
  ['8pc Garden Hand Tool Set','9-in-1 Modular Raised Garden Bed','Solar LED Path Lights 12pk','Expandable Garden Hose 100ft','Tumbling Composter 43 Gallon','9pc Outdoor Patio Dining Set','9ft Market Patio Umbrella','Steel Yard Wheelbarrow 6-Cu-Ft','Seed Starting Tray & Dome Kit','Glass Wild Bird Feeder','16" Cordless Electric Lawn Edger','Terracotta Planter Pot Set 5pk'],
  ['Premium Dry Dog Food Chicken 30lb','Ultra Clumping Cat Litter Unscented 40lb','KONG Classic Interactive Dog Toy Set','72" Cat Tree with Scratching Post','Complete Freshwater Aquarium Starter Kit','Deluxe Parakeet Bird Cage','Airline Approved Pet Carrier Soft M','Orthopedic Dog Bed Memory Foam L','Automatic Pet Feeder 6-Meal','Tropical Fish Food Flakes Variety','Professional Pet Grooming Kit 7pc','Calming Chews for Anxious Dogs 90ct'],
  ['Fender CD-60S Acoustic Guitar Natural','Yamaha P-45 Digital Piano 88-Key','Alesis Nitro Mesh Electronic Drum Kit','4/4 Violin Starter Kit with Case','Kala Soprano Ukulele Concert Mahogany','Fender Frontman 10G Practice Amp','Arturia MiniLab MkII 25-Key MIDI','Capo + Clip-On Chromatic Tuner Bundle','Hohner Blues Harmonica 7-Piece Set','Jean Paul Student Bb Trumpet Lacquer','Jupiter JFL-700 Student Concert Flute','Blue Yeti USB Condenser Microphone'],
  ['Arteza Acrylic Paint Set 60 Colors','Princeton Watercolor Round Brush Set 12pc','Canson XL Mixed Media Sketchbook A4','Prismacolor Premier Colored Pencils 132pk','Canvas Panel Boards 11x14" 16pk','Speedball Calligraphy Pen Set 8pc','Plastilina Modeling Clay Starter Kit','Mylar Reusable Stencil Variety Set 40pk','Origami Paper 500pk Assorted Patterns','Diamond Art Painting Kit 12x16"','Dimensions Gold Embroidery Starter Set','ArtResin Epoxy Art Resin 32oz Kit'],
  ['1ct Diamond Solitaire Pendant 14K Gold','Seiko Men\'s Chronograph Analog Watch','Cultured Pearl Drop Earrings Sterling','14K Gold Cable Chain Bracelet 18"','Citizen Eco-Drive Ladies Silhouette Watch','0.5ct Diamond Accent Ring 18K White Gold','Lab-Created Sapphire Pendant Necklace','Samsung Galaxy Watch6 Classic 47mm','Montblanc Sterling Silver Cufflinks','Woven Bangle Bracelet Set 5pc','Rose Gold Stud Earrings Crystal','Fossil Townsman Leather Strap Watch 44mm'],
  ['Infant Optics DXR-8 Pro Video Baby Monitor','Graco TriRide 3-in-1 Convertible Car Seat','Ergobaby Omni 360 Baby Carrier 4-Position','Chicco Bravo Trio Stroller Travel System','BEABA Babycook Neo 4-in-1 Baby Food Maker','Amazon Fire HD 10 Kids Edition 10"','VTech Sit-to-Stand Learning Walker','Skip Hop Forma Diaper Bag Backpack','4moms Cleanwater Baby Bath Tub','Melissa & Doug Flash Cards 6-Set','Skip Hop Alphabet Zoo Activity Play Mat','Munchkin Miracle 360° Sippy Cup Set 6pk'],
  ['Samsonite Omni 3-Piece Hardside Spinner Set','Away The Carry-On 21" Aluminum','Osprey Farpoint 40 Travel Backpack','Eagle Creek Pack-It Original Set 8pc','Zoppen Multi-Currency RFID Travel Wallet','Trtl Pillow Plus Extra-Support Travel Neck Pillow','Etekcity Digital Luggage Scale 110lb','Earth Pak Waterproof Dry Bag 40L','Lewis N. Clark RFID Money Belt Waist','BESTEK Universal Travel Adapter 220V','Sockwell Circulator Moderate Socks 3pk','Shacke Pak 5-Set Packing Cubes'],
  ['Milwaukee M18 Brushless Cordless Drill','DEWALT 5-Inch Random Orbital Sander','SKIL 15-Amp 7-1/4" Circular Saw','DEWALT DW088K Cross-Line Laser Level','Stanley 40-Piece 1/4" & 3/8" Socket Set','Irwin ProTouch Utility Knife','DEWALT 20V MAX LED Work Light','Zircon StudSensor HD55 Center Finder','Stanley 25ft PowerLock Tape Measure','DEWALT Titanium Drill Bit Set 135pc','Wera Kraftform Plus Screwdriver Set 42pc','Empire Level 400-48" Aluminum Level'],
  ['SteelSeries Arctis 7 Wireless Gaming Headset','Xbox Elite Controller Series 2 Core White','Secretlab TITAN Evo 2022 Gaming Chair','Razer DeathAdder V3 HyperSpeed Mouse','Elgato 4K60 Pro MK.2 Capture Card','Blue Yeti X Professional USB Microphone','Corsair K100 RGB MX Speed Optical Keyboard','LG 27GP850-B 27" Nano IPS 165Hz Monitor','Elgato Stream Deck MK.2 15 Keys','Meta Quest 3 128GB VR Headset','SteelSeries QcK Edge Medium Gaming Mousepad','Sid Meier\'s Civilization VII Deluxe Edition'],
  ['Criterion Collection Sci-Fi Box Set 8-Films','Analogue Productions Audiophile Vinyl Sampler','Star Wars Skywalker Saga 9-Film Blu-Ray','Deutsche Grammophon 111 Years CD 55-Disc','Ken Burns Documentary Collection Blu-Ray','Pixar Complete 25-Movie Collection','Led Zeppelin Remasters 3LP 180g Vinyl','Shure SM7B Cardioid Dynamic Vocal Microphone','Sony UBP-X700 4K Ultra HD Blu-Ray Player','Audio-Technica AT-LP120XUSB Turntable','Netflix Gift Card $100 Digital','Singtrix Party Bundle Karaoke System'],
];

const SKU_PREFIXES = [
  'ELEC','CLTH','HOME','SPRT','BOOK','BEAU','TOYS','FOOD',
  'AUTO','OFFC','GRDN','PETS','MUSC','ARTS','JEWL','BABY',
  'TRVL','TOOL','GAME','MOVI',
];

// Base prices per category [min, max]
const PRICE_RANGES: [number, number][] = [
  [29.99, 799.99], [14.99, 179.99], [19.99, 399.99], [9.99, 279.99],
  [9.99,  49.99],  [12.99, 129.99], [14.99, 199.99], [9.99,  79.99],
  [14.99, 249.99], [12.99, 299.99], [19.99, 299.99], [19.99, 149.99],
  [49.99, 599.99], [9.99,  89.99],  [49.99, 799.99], [19.99, 499.99],
  [19.99, 399.99], [14.99, 349.99], [29.99, 499.99], [19.99, 299.99],
];

const HR_DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'Human Resources',
  'Finance', 'Operations', 'Customer Support', 'Product Management',
  'Legal', 'Research & Development',
];

const HR_TITLES = [
  'Software Engineer', 'Marketing Specialist', 'Sales Representative', 'HR Business Partner',
  'Financial Analyst', 'Operations Coordinator', 'Support Specialist', 'Product Manager',
  'Legal Counsel', 'Research Scientist',
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

function realisticPrice(catIdx: number, seed: number): number {
  const [min, max] = PRICE_RANGES[catIdx];
  const raw = min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  const endings = [0.99, 0.49, 0.95, 0.00];
  return Math.floor(raw) + endings[seed % 4];
}

async function seed() {
  const conn = await mysql.createConnection(url);
  const rand = mulberry32(20260331);

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    // ========== RETAIL ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS retail');
    await conn.query('USE retail');

    await conn.query('DROP TABLE IF EXISTS order_items');
    await conn.query('DROP TABLE IF EXISTS orders');
    await conn.query('DROP TABLE IF EXISTS products');
    await conn.query('DROP TABLE IF EXISTS categories');
    await conn.query('DROP TABLE IF EXISTS staff');
    await conn.query('DROP TABLE IF EXISTS customers');

    await conn.query(`CREATE TABLE categories (category_id INT PRIMARY KEY, name VARCHAR(100) NOT NULL)`);
    await conn.query(`CREATE TABLE products (
      product_id INT PRIMARY KEY, category_id INT NOT NULL, sku VARCHAR(40) NOT NULL,
      name VARCHAR(200) NOT NULL, list_price DECIMAL(10,2) NOT NULL, INDEX idx_cat (category_id))`);
    await conn.query(`CREATE TABLE customers (
      customer_id INT PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL,
      email VARCHAR(120) NOT NULL, city VARCHAR(80) NOT NULL)`);
    await conn.query(`CREATE TABLE staff (staff_id INT PRIMARY KEY, full_name VARCHAR(100) NOT NULL, role VARCHAR(50) NOT NULL)`);
    await conn.query(`CREATE TABLE orders (
      order_id INT PRIMARY KEY, customer_id INT NOT NULL, staff_id INT NOT NULL,
      order_date DATE NOT NULL, status VARCHAR(20) NOT NULL,
      INDEX idx_cust_date (customer_id, order_date), INDEX idx_status (status))`);
    await conn.query(`CREATE TABLE order_items (
      order_item_id BIGINT PRIMARY KEY, order_id INT NOT NULL, product_id INT NOT NULL,
      qty INT NOT NULL, paid_price DECIMAL(10,2) NOT NULL, INDEX idx_order (order_id))`);

    // Categories
    await chunkInsert(conn, 'categories', ['category_id','name'],
      CATEGORY_NAMES.map((name, i) => [i + 1, name]));

    // Products — 10 per category × 20 categories = 200
    const prods: unknown[][] = [];
    for (let p = 1; p <= 200; p++) {
      const catIdx = (p - 1) % 20;
      const nameIdx = Math.floor((p - 1) / 20);
      const name = PRODUCT_NAMES[catIdx][nameIdx];
      const sku  = `${SKU_PREFIXES[catIdx]}-${String(p).padStart(4,'0')}`;
      prods.push([p, catIdx + 1, sku, name, realisticPrice(catIdx, p)]);
    }
    await chunkInsert(conn, 'products', ['product_id','category_id','sku','name','list_price'], prods);

    // Customers — 500 realistic names; customer 42 pinned to Chicago for L02_R03
    const custs: unknown[][] = [];
    for (let c = 1; c <= 500; c++) {
      const fn   = pick(FIRST_NAMES, c - 1);
      const ln   = pick(LAST_NAMES, Math.floor((c - 1) / 10));
      const email = `${fn.toLowerCase()[0]}${ln.toLowerCase()}${c}@${pick(EMAIL_DOMAINS, c)}`;
      const city = c === 42 ? 'Chicago' : pick(CITIES, c - 1);
      custs.push([c, fn, ln, email, city]);
    }
    await chunkInsert(conn, 'customers', ['customer_id','first_name','last_name','email','city'], custs);

    // Staff — 40 realistic names; every 5th is MANAGER
    const staffRows: unknown[][] = [];
    for (let s = 1; s <= 40; s++) {
      const fn = pick(FIRST_NAMES, s + 10);
      const ln = pick(LAST_NAMES,  s + 5);
      const role = s % 5 === 0 ? 'MANAGER' : 'CLERK';
      staffRows.push([s, `${fn} ${ln}`, role]);
    }
    await chunkInsert(conn, 'staff', ['staff_id','full_name','role'], staffRows);

    // Orders — 3500 rows; last 100 forced to customer 42, June 2023
    const ordersRows: unknown[][] = [];
    for (let oid = 1; oid <= 3400; oid++) {
      const cid = 1 + Math.floor(rand() * 500);
      const day = (oid * 17 + 3) % 365;
      const ds  = new Date(Date.UTC(2023, 0, 1 + day)).toISOString().slice(0, 10);
      const st  = oid % 3 === 0 ? 'CANCELLED' : 'COMPLETED';
      ordersRows.push([oid, cid, 1 + (oid % 40), ds, st]);
    }
    for (let oid = 3401; oid <= 3500; oid++) {
      const dayInJune = (oid - 3401) % 28;
      const ds = `2023-06-${String(dayInJune + 1).padStart(2,'0')}`;
      ordersRows.push([oid, 42, 1 + (oid % 40), ds, 'COMPLETED']);
    }
    await chunkInsert(conn, 'orders', ['order_id','customer_id','staff_id','order_date','status'], ordersRows);

    // Order items — 2 per order
    const oi: unknown[][] = [];
    let oiid = 1;
    for (let oid = 1; oid <= 3500; oid++) {
      for (let k = 0; k < 2; k++) {
        oi.push([oiid++, oid, 1 + ((oid + k) % 200), 1 + (oid % 4), 15 + (oid % 30) + 0.5 * k]);
      }
    }
    await chunkInsert(conn, 'order_items', ['order_item_id','order_id','product_id','qty','paid_price'], oi);

    // ========== HR ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS hr');
    await conn.query('USE hr');
    await conn.query('DROP TABLE IF EXISTS dept_manager');
    await conn.query('DROP TABLE IF EXISTS titles');
    await conn.query('DROP TABLE IF EXISTS salaries');
    await conn.query('DROP TABLE IF EXISTS dept_emp');
    await conn.query('DROP TABLE IF EXISTS employees');
    await conn.query('DROP TABLE IF EXISTS departments');

    await conn.query(`CREATE TABLE departments (dept_no VARCHAR(10) PRIMARY KEY, dept_name VARCHAR(100) NOT NULL)`);
    await conn.query(`CREATE TABLE employees (
      emp_no INT PRIMARY KEY, birth_date DATE NOT NULL, first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL, hire_date DATE NOT NULL, gender CHAR(1) NOT NULL)`);
    await conn.query(`CREATE TABLE dept_emp (
      emp_no INT NOT NULL, dept_no VARCHAR(10) NOT NULL, from_date DATE NOT NULL, to_date DATE NOT NULL,
      PRIMARY KEY (emp_no, dept_no, from_date), INDEX idx_dept (dept_no))`);
    await conn.query(`CREATE TABLE salaries (
      emp_no INT NOT NULL, salary INT NOT NULL, from_date DATE NOT NULL, to_date DATE NOT NULL,
      PRIMARY KEY (emp_no, from_date), INDEX idx_emp (emp_no), INDEX idx_dates (from_date, to_date))`);
    await conn.query(`CREATE TABLE titles (
      emp_no INT NOT NULL, title VARCHAR(80) NOT NULL, from_date DATE NOT NULL, to_date DATE NOT NULL,
      PRIMARY KEY (emp_no, title, from_date))`);
    await conn.query(`CREATE TABLE dept_manager (
      dept_no VARCHAR(10) NOT NULL, emp_no INT NOT NULL, from_date DATE NOT NULL, to_date DATE NOT NULL,
      PRIMARY KEY (dept_no, emp_no, from_date))`);

    // Departments — 10 real names
    const depts: unknown[][] = HR_DEPARTMENTS.map((name, i) => {
      const code = `d${String(i + 1).padStart(3,'0')}`;
      return [code, name];
    });
    await chunkInsert(conn, 'departments', ['dept_no','dept_name'], depts);

    // Employees — 400 with realistic varied dates; emp 101 pinned for salary questions
    const emps: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      const fn = pick(FIRST_NAMES, e - 1);
      const ln = pick(LAST_NAMES,  Math.floor((e - 1) / 10));
      const birthYear = 1965 + (e % 26);
      const birthDate = `${birthYear}-${String(1 + (e % 12)).padStart(2,'0')}-${String(1 + (e % 28)).padStart(2,'0')}`;
      const hireYear  = 2000 + (e % 20);
      const hireDate  = `${hireYear}-${String(1 + ((e + 3) % 12)).padStart(2,'0')}-${String(1 + ((e + 7) % 28)).padStart(2,'0')}`;
      const gender = e % 2 === 0 ? 'M' : 'F';
      emps.push([e, birthDate, fn, ln, hireDate, gender]);
    }
    await chunkInsert(conn, 'employees', ['emp_no','birth_date','first_name','last_name','hire_date','gender'], emps);

    // Dept emp — d001 (Engineering) gets 220 employees (largest dept for question L06_H01)
    const deRows: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      const dept = e <= 220 ? 'd001' : `d${String(2 + (e % 9)).padStart(3,'0')}`;
      deRows.push([e, dept, '2010-06-01', '2099-01-01']);
    }
    await chunkInsert(conn, 'dept_emp', ['emp_no','dept_no','from_date','to_date'], deRows);

    // Salaries — realistic ranges; emp 101 pinned history; emp 333 pinned at 200000
    const salRows: unknown[][] = [];
    const emp101Rows: unknown[][] = [
      [101, 88000, '2020-03-01', '2021-03-01'],
      [101, 91000, '2021-03-01', '2022-03-01'],
      [101, 94000, '2022-03-01', '2023-03-01'],
      [101, 97000, '2023-03-01', '2024-03-01'],
      [101, 99000, '2024-03-01', '2099-01-01'],
    ];
    for (let i = 0; i < 3495; i++) {
      let emp = 1 + (i % 400);
      if (emp === 101) emp = 102;
      const from = new Date(Date.UTC(2000, 0, 1 + i));
      let salary = 45000 + (i * 73) % 110000; // Range ~45k–155k
      let toStr  = i % 17 === 0 ? '2099-01-01' : '2021-06-01';
      if (emp === 333) { salary = 200000; toStr = '2099-01-01'; }
      salRows.push([emp, salary, from.toISOString().slice(0,10), toStr]);
    }
    for (const row of emp101Rows) salRows.push(row);
    await chunkInsert(conn, 'salaries', ['emp_no','salary','from_date','to_date'], salRows);

    // Titles — use realistic department-aligned titles
    const tit: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      const deptIdx = e <= 220 ? 0 : (1 + (e % 9));
      tit.push([e, HR_TITLES[deptIdx % HR_TITLES.length], '2010-06-01', '2099-01-01']);
    }
    await chunkInsert(conn, 'titles', ['emp_no','title','from_date','to_date'], tit);

    // Dept managers
    const dm: unknown[][] = HR_DEPARTMENTS.map((_, i) => {
      const code = `d${String(i + 1).padStart(3,'0')}`;
      return [code, i + 1, '2015-01-01', '2099-01-01'];
    });
    await chunkInsert(conn, 'dept_manager', ['dept_no','emp_no','from_date','to_date'], dm);

    // ========== SQL_PRACTICE ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS sql_practice');
    await conn.query('USE sql_practice');
    await conn.query('DROP TABLE IF EXISTS questions');
    await conn.query('DROP TABLE IF EXISTS levels');

    await conn.query(`CREATE TABLE levels (
      level_id INT PRIMARY KEY, sort_order INT NOT NULL UNIQUE, slug VARCHAR(40) NOT NULL UNIQUE,
      title VARCHAR(120) NOT NULL, description TEXT NOT NULL, syntax TEXT NOT NULL,
      patterns TEXT NOT NULL, tips TEXT NOT NULL)`);
    await conn.query(`CREATE TABLE questions (
      id VARCHAR(16) PRIMARY KEY, level_id INT NOT NULL, sort_order INT NOT NULL,
      db VARCHAR(64) NOT NULL, title VARCHAR(200) NOT NULL,
      difficulty ENUM('easy','medium','hard') NOT NULL, prompt TEXT NOT NULL,
      hint TEXT NOT NULL, canonical_sql TEXT NOT NULL, starter_sql TEXT DEFAULT NULL,
      build_concept JSON NOT NULL,
      UNIQUE KEY uq_level_order (level_id, sort_order),
      FOREIGN KEY (level_id) REFERENCES levels(level_id))`);

    for (const lvl of LEVELS) {
      await conn.query(
        `INSERT INTO levels (level_id, sort_order, slug, title, description, syntax, patterns, tips) VALUES (?,?,?,?,?,?,?,?)`,
        [lvl.level_id, lvl.sort_order, lvl.slug, lvl.title, lvl.description, lvl.syntax, lvl.patterns, lvl.tips],
      );
    }
    console.log(`  ✓ Seeded ${LEVELS.length} levels`);

    for (const q of QUESTIONS) {
      await conn.query(
        `INSERT INTO questions (id, level_id, sort_order, db, title, difficulty, prompt, hint, canonical_sql, starter_sql, build_concept) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [q.id, q.level_id, q.sort_order, q.db, q.title, q.difficulty, q.prompt, q.hint, q.canonical_sql, q.starter_sql, JSON.stringify(q.build_concept)],
      );
    }
    console.log(`  ✓ Seeded ${QUESTIONS.length} questions`);

    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('Seed complete: retail, hr, sql_practice ✓');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
