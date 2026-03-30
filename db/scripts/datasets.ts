export type DatasetTable = {
  name: string;
  description: string;
  columns: Array<{ name: string; definition: string; displayType: string }>;
  rows: Record<string, string | number | null>[];
};

export type Dataset = {
  slug: string;
  name: string;
  description: string;
  tables: DatasetTable[];
  erDiagram?: string;
};

export type QuestionSeed = {
  schemaSlug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  canonicalSql: string;
  tags: string[];
  explanationStub?: string;
  optimalityNotes?: string;
};

export const datasets: Dataset[] = [
  {
    slug: 'retail',
    name: 'Retail Store',
    description: 'Customers purchasing catalog products with simple orders.',
    tables: [
      {
        name: 'products',
        description: 'Catalog of purchasable items and their categories.',
        columns: [
          { name: 'product_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'category', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'price', definition: 'NUMERIC(10,2) NOT NULL', displayType: 'numeric' },
        ],
        rows: [
          { product_id: 1, name: 'Noise Cancelling Headphones', category: 'Audio', price: 249.99 },
          { product_id: 2, name: 'Smart Fitness Band', category: 'Wearables', price: 89.0 },
          { product_id: 3, name: 'Espresso Machine', category: 'Kitchen', price: 349.5 },
          { product_id: 4, name: 'Mechanical Keyboard', category: 'Computing', price: 129.99 },
          { product_id: 5, name: '4K Monitor', category: 'Displays', price: 399.99 },
        ],
      },
      {
        name: 'customers',
        description: 'End users enrolled in the loyalty program.',
        columns: [
          { name: 'customer_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'full_name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'city', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'loyalty_tier', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { customer_id: 1, full_name: 'Asha Nair', city: 'Bengaluru', loyalty_tier: 'Platinum' },
          { customer_id: 2, full_name: 'Ravi Shah', city: 'Ahmedabad', loyalty_tier: 'Gold' },
          { customer_id: 3, full_name: 'Maya Kulkarni', city: 'Pune', loyalty_tier: 'Silver' },
          { customer_id: 4, full_name: 'Dev Mehta', city: 'Mumbai', loyalty_tier: 'Platinum' },
          { customer_id: 5, full_name: 'Sara Jacob', city: 'Kochi', loyalty_tier: 'Gold' },
        ],
      },
      {
        name: 'orders',
        description: 'Line-level purchases mapped to customers and products.',
        columns: [
          { name: 'order_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'customer_id', definition: 'INTEGER REFERENCES retail.customers(customer_id)', displayType: 'integer' },
          { name: 'product_id', definition: 'INTEGER REFERENCES retail.products(product_id)', displayType: 'integer' },
          { name: 'quantity', definition: 'INTEGER NOT NULL', displayType: 'integer' },
          { name: 'order_date', definition: 'DATE NOT NULL', displayType: 'date' },
        ],
        rows: [
          { order_id: 1, customer_id: 1, product_id: 1, quantity: 2, order_date: '2026-02-10' },
          { order_id: 2, customer_id: 2, product_id: 3, quantity: 1, order_date: '2026-02-12' },
          { order_id: 3, customer_id: 1, product_id: 4, quantity: 1, order_date: '2026-02-18' },
          { order_id: 4, customer_id: 4, product_id: 5, quantity: 1, order_date: '2026-03-01' },
          { order_id: 5, customer_id: 5, product_id: 2, quantity: 3, order_date: '2026-03-05' },
        ],
      },
    ],
  },
  {
    slug: 'hr',
    name: 'GrowthOps HR',
    description: 'Department roster with comp and performance reviews.',
    tables: [
      {
        name: 'departments',
        description: 'Business units and their office locations.',
        columns: [
          { name: 'department_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'location', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { department_id: 1, name: 'Analytics', location: 'Mumbai' },
          { department_id: 2, name: 'People Operations', location: 'Pune' },
          { department_id: 3, name: 'Sales', location: 'Delhi' },
        ],
      },
      {
        name: 'employees',
        description: 'Active teammates with salary details.',
        columns: [
          { name: 'employee_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'full_name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'department_id', definition: 'INTEGER REFERENCES hr.departments(department_id)', displayType: 'integer' },
          { name: 'salary', definition: 'NUMERIC(10,2) NOT NULL', displayType: 'numeric' },
          { name: 'hire_date', definition: 'DATE NOT NULL', displayType: 'date' },
        ],
        rows: [
          { employee_id: 1, full_name: 'Ishita Rao', department_id: 1, salary: 105000, hire_date: '2021-06-14' },
          { employee_id: 2, full_name: 'Kunal Singh', department_id: 1, salary: 92000, hire_date: '2022-03-01' },
          { employee_id: 3, full_name: 'Priya Das', department_id: 2, salary: 78000, hire_date: '2020-11-20' },
          { employee_id: 4, full_name: 'Vikram Jain', department_id: 3, salary: 68000, hire_date: '2019-08-10' },
          { employee_id: 5, full_name: 'Nisha Patel', department_id: 2, salary: 83000, hire_date: '2023-02-01' },
        ],
      },
      {
        name: 'performance_reviews',
        description: 'Quarterly rating snapshots.',
        columns: [
          { name: 'review_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'employee_id', definition: 'INTEGER REFERENCES hr.employees(employee_id)', displayType: 'integer' },
          { name: 'rating', definition: 'INTEGER NOT NULL', displayType: 'integer' },
          { name: 'reviewer', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'review_date', definition: 'DATE NOT NULL', displayType: 'date' },
        ],
        rows: [
          { review_id: 1, employee_id: 1, rating: 5, reviewer: 'Head Analytics', review_date: '2024-12-15' },
          { review_id: 2, employee_id: 2, rating: 4, reviewer: 'Head Analytics', review_date: '2024-12-15' },
          { review_id: 3, employee_id: 3, rating: 3, reviewer: 'CHRO', review_date: '2024-12-16' },
          { review_id: 4, employee_id: 4, rating: 3, reviewer: 'CSO', review_date: '2024-11-30' },
          { review_id: 5, employee_id: 5, rating: 5, reviewer: 'CHRO', review_date: '2024-12-16' },
        ],
      },
    ],
  },
  {
    slug: 'flights',
    name: 'AeroStat',
    description: 'Airlines, airports, and on-time flight operations.',
    tables: [
      {
        name: 'airports',
        description: 'IATA airport directory.',
        columns: [
          { name: 'code', definition: 'TEXT PRIMARY KEY', displayType: 'text' },
          { name: 'city', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'country', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { code: 'DEL', city: 'New Delhi', country: 'India' },
          { code: 'BOM', city: 'Mumbai', country: 'India' },
          { code: 'BLR', city: 'Bengaluru', country: 'India' },
          { code: 'DXB', city: 'Dubai', country: 'UAE' },
        ],
      },
      {
        name: 'airlines',
        description: 'Operating carriers.',
        columns: [
          { name: 'code', definition: 'TEXT PRIMARY KEY', displayType: 'text' },
          { name: 'name', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { code: 'AI', name: 'Air India' },
          { code: '6E', name: 'IndiGo' },
          { code: 'EK', name: 'Emirates' },
        ],
      },
      {
        name: 'flights',
        description: 'Scheduled flight legs with status.',
        columns: [
          { name: 'flight_no', definition: 'TEXT PRIMARY KEY', displayType: 'text' },
          { name: 'airline_code', definition: 'TEXT REFERENCES flights.airlines(code)', displayType: 'text' },
          { name: 'origin', definition: 'TEXT REFERENCES flights.airports(code)', displayType: 'text' },
          { name: 'destination', definition: 'TEXT REFERENCES flights.airports(code)', displayType: 'text' },
          { name: 'departure_time', definition: 'TIMESTAMPTZ NOT NULL', displayType: 'timestamp' },
          { name: 'arrival_time', definition: 'TIMESTAMPTZ NOT NULL', displayType: 'timestamp' },
          { name: 'status', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          {
            flight_no: 'AI801',
            airline_code: 'AI',
            origin: 'DEL',
            destination: 'BLR',
            departure_time: '2026-03-30T06:30:00Z',
            arrival_time: '2026-03-30T09:10:00Z',
            status: 'ONTIME',
          },
          {
            flight_no: '6E212',
            airline_code: '6E',
            origin: 'BLR',
            destination: 'DEL',
            departure_time: '2026-03-30T05:15:00Z',
            arrival_time: '2026-03-30T07:45:00Z',
            status: 'DELAYED',
          },
          {
            flight_no: 'EK507',
            airline_code: 'EK',
            origin: 'BOM',
            destination: 'DXB',
            departure_time: '2026-03-29T22:00:00Z',
            arrival_time: '2026-03-30T01:30:00Z',
            status: 'ONTIME',
          },
        ],
      },
    ],
  },
  {
    slug: 'library',
    name: 'City Library',
    description: 'Books, authors, and active loan transactions.',
    tables: [
      {
        name: 'authors',
        description: 'Writers with pen names.',
        columns: [
          { name: 'author_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'country', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { author_id: 1, name: 'Chitra Banerjee', country: 'India' },
          { author_id: 2, name: 'Amor Towles', country: 'USA' },
          { author_id: 3, name: 'Neil Gaiman', country: 'UK' },
        ],
      },
      {
        name: 'books',
        description: 'Catalog inventory.',
        columns: [
          { name: 'book_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'title', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'author_id', definition: 'INTEGER REFERENCES library.authors(author_id)', displayType: 'integer' },
          { name: 'published_year', definition: 'INTEGER NOT NULL', displayType: 'integer' },
          { name: 'genre', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { book_id: 1, title: 'Palace of Illusions', author_id: 1, published_year: 2008, genre: 'Mythology' },
          { book_id: 2, title: 'The Lincoln Highway', author_id: 2, published_year: 2021, genre: 'Fiction' },
          { book_id: 3, title: 'Neverwhere', author_id: 3, published_year: 1996, genre: 'Fantasy' },
          { book_id: 4, title: 'Coraline', author_id: 3, published_year: 2002, genre: 'Fantasy' },
        ],
      },
      {
        name: 'loans',
        description: 'Current and historical borrowings.',
        columns: [
          { name: 'loan_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'book_id', definition: 'INTEGER REFERENCES library.books(book_id)', displayType: 'integer' },
          { name: 'member_name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'loan_date', definition: 'DATE NOT NULL', displayType: 'date' },
          { name: 'return_date', definition: 'DATE', displayType: 'date' },
        ],
        rows: [
          { loan_id: 1, book_id: 1, member_name: 'Harini', loan_date: '2026-03-10', return_date: null },
          { loan_id: 2, book_id: 3, member_name: 'Rohan', loan_date: '2026-03-01', return_date: '2026-03-20' },
          { loan_id: 3, book_id: 2, member_name: 'Ira', loan_date: '2026-03-18', return_date: null },
        ],
      },
    ],
  },
  {
    slug: 'finance',
    name: 'Civic Bank',
    description: 'Retail bank accounts and recent transactions.',
    tables: [
      {
        name: 'branches',
        description: 'Branch managers per city.',
        columns: [
          { name: 'branch_code', definition: 'TEXT PRIMARY KEY', displayType: 'text' },
          { name: 'city', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'manager', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { branch_code: 'BLR01', city: 'Bengaluru', manager: 'Lakshmi Menon' },
          { branch_code: 'DEL02', city: 'Delhi', manager: 'Sameer Arora' },
          { branch_code: 'MUM03', city: 'Mumbai', manager: 'Anil Dsouza' },
        ],
      },
      {
        name: 'accounts',
        description: 'Customer balances per branch.',
        columns: [
          { name: 'account_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'holder_name', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'branch_code', definition: 'TEXT REFERENCES finance.branches(branch_code)', displayType: 'text' },
          { name: 'account_type', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'balance', definition: 'NUMERIC(12,2) NOT NULL', displayType: 'numeric' },
        ],
        rows: [
          { account_id: 1, holder_name: 'Sahana Iyer', branch_code: 'BLR01', account_type: 'Savings', balance: 15000.25 },
          { account_id: 2, holder_name: 'Rahul Verma', branch_code: 'DEL02', account_type: 'Current', balance: 8700.0 },
          { account_id: 3, holder_name: 'Farah Khan', branch_code: 'MUM03', account_type: 'Savings', balance: 22300.75 },
          { account_id: 4, holder_name: 'Kiran Rao', branch_code: 'BLR01', account_type: 'Savings', balance: 5400.0 },
        ],
      },
      {
        name: 'transactions',
        description: 'Money movement categorized by purpose.',
        columns: [
          { name: 'transaction_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'account_id', definition: 'INTEGER REFERENCES finance.accounts(account_id)', displayType: 'integer' },
          { name: 'amount', definition: 'NUMERIC(12,2) NOT NULL', displayType: 'numeric' },
          { name: 'txn_type', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'txn_date', definition: 'DATE NOT NULL', displayType: 'date' },
          { name: 'category', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { transaction_id: 1, account_id: 1, amount: 5000, txn_type: 'DEBIT', txn_date: '2026-03-03', category: 'Rent' },
          { transaction_id: 2, account_id: 1, amount: 2000, txn_type: 'CREDIT', txn_date: '2026-03-05', category: 'Salary' },
          { transaction_id: 3, account_id: 2, amount: 3500, txn_type: 'DEBIT', txn_date: '2026-03-07', category: 'Vendors' },
          { transaction_id: 4, account_id: 3, amount: 1200, txn_type: 'DEBIT', txn_date: '2026-03-08', category: 'Travel' },
          { transaction_id: 5, account_id: 4, amount: 900, txn_type: 'CREDIT', txn_date: '2026-03-09', category: 'Refund' },
        ],
      },
    ],
  },
  {
    slug: 'social',
    name: 'SocialHub',
    description: 'Microblog posts and reactions.',
    tables: [
      {
        name: 'users',
        description: 'Registered members.',
        columns: [
          { name: 'user_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'username', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'city', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'joined_date', definition: 'DATE NOT NULL', displayType: 'date' },
        ],
        rows: [
          { user_id: 1, username: 'data_dev', city: 'Bengaluru', joined_date: '2024-06-01' },
          { user_id: 2, username: 'sqlnerd', city: 'Hyderabad', joined_date: '2024-09-12' },
          { user_id: 3, username: 'chartqueen', city: 'Delhi', joined_date: '2025-01-20' },
        ],
      },
      {
        name: 'posts',
        description: 'Timeline updates.',
        columns: [
          { name: 'post_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'user_id', definition: 'INTEGER REFERENCES social.users(user_id)', displayType: 'integer' },
          { name: 'content', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'posted_at', definition: 'TIMESTAMPTZ NOT NULL', displayType: 'timestamp' },
          { name: 'topic', definition: 'TEXT NOT NULL', displayType: 'text' },
        ],
        rows: [
          { post_id: 1, user_id: 1, content: 'Indexes vs partitions thread', posted_at: '2026-03-25T07:00:00Z', topic: 'databases' },
          { post_id: 2, user_id: 2, content: 'Window functions cheat sheet', posted_at: '2026-03-26T09:30:00Z', topic: 'sql' },
          { post_id: 3, user_id: 3, content: 'Chart race animation sneak peek', posted_at: '2026-03-28T11:15:00Z', topic: 'visualization' },
        ],
      },
      {
        name: 'reactions',
        description: 'Emoji reactions per post.',
        columns: [
          { name: 'reaction_id', definition: 'SERIAL PRIMARY KEY', displayType: 'integer' },
          { name: 'post_id', definition: 'INTEGER REFERENCES social.posts(post_id)', displayType: 'integer' },
          { name: 'user_id', definition: 'INTEGER REFERENCES social.users(user_id)', displayType: 'integer' },
          { name: 'reaction', definition: 'TEXT NOT NULL', displayType: 'text' },
          { name: 'reacted_at', definition: 'TIMESTAMPTZ NOT NULL', displayType: 'timestamp' },
        ],
        rows: [
          { reaction_id: 1, post_id: 1, user_id: 2, reaction: 'clap', reacted_at: '2026-03-25T08:00:00Z' },
          { reaction_id: 2, post_id: 1, user_id: 3, reaction: 'fire', reacted_at: '2026-03-25T08:30:00Z' },
          { reaction_id: 3, post_id: 2, user_id: 1, reaction: 'like', reacted_at: '2026-03-26T10:00:00Z' },
          { reaction_id: 4, post_id: 3, user_id: 1, reaction: 'clap', reacted_at: '2026-03-28T12:00:00Z' },
        ],
      },
    ],
  },
];

export const questionSeeds: QuestionSeed[] = [
  {
    schemaSlug: 'retail',
    difficulty: 'easy',
    prompt: 'List Platinum loyalty customers alphabetically with their home city.',
    canonicalSql: `SELECT customer_id, full_name, city
                   FROM retail.customers
                   WHERE loyalty_tier = 'Platinum'
                   ORDER BY full_name;`,
    tags: ['filtering', 'ordering'],
    explanationStub: 'Simple filtering on a dimension table.',
    optimalityNotes: 'Use the covering index on loyalty_tier and avoid unnecessary joins.',
  },
  {
    schemaSlug: 'retail',
    difficulty: 'medium',
    prompt: 'Return the top 3 products by total quantity ordered, showing category and total units sold.',
    canonicalSql: `SELECT p.name, p.category, SUM(o.quantity) AS total_units
                   FROM retail.orders o
                   JOIN retail.products p ON p.product_id = o.product_id
                   GROUP BY p.name, p.category
                   ORDER BY total_units DESC
                   LIMIT 3;`,
    tags: ['aggregation', 'joins'],
    explanationStub: 'Requires joining facts with dimension and aggregating.',
    optimalityNotes: 'Pre-aggregate at product level so the LIMIT can leverage sort + top-N heaps.',
  },
  {
    schemaSlug: 'hr',
    difficulty: 'medium',
    prompt: 'Compute average salary per department for teams with rating average above 4.',
    canonicalSql: `WITH dept_perf AS (
                     SELECT e.department_id, AVG(r.rating) AS avg_rating
                     FROM hr.employees e
                     JOIN hr.performance_reviews r ON r.employee_id = e.employee_id
                     GROUP BY e.department_id
                   )
                   SELECT d.name, ROUND(AVG(e.salary),2) AS avg_salary
                   FROM hr.employees e
                   JOIN hr.departments d ON d.department_id = e.department_id
                   JOIN dept_perf dp ON dp.department_id = d.department_id
                   WHERE dp.avg_rating > 4
                   GROUP BY d.name
                   ORDER BY avg_salary DESC;`,
    tags: ['cte', 'grouping'],
    explanationStub: 'Needs two aggregations and filtering on derived metric.',
    optimalityNotes: 'Filter departments after computing review averages to keep the salary aggregation set small.',
  },
  {
    schemaSlug: 'flights',
    difficulty: 'easy',
    prompt: 'Show all flights departing from Bengaluru (BLR) with airline name and status.',
    canonicalSql: `SELECT f.flight_no, a.name AS airline, f.destination, f.status
                   FROM flights.flights f
                   JOIN flights.airlines a ON a.code = f.airline_code
                   WHERE f.origin = 'BLR'
                   ORDER BY f.flight_no;`,
    tags: ['joins'],
  },
  {
    schemaSlug: 'library',
    difficulty: 'medium',
    prompt: 'List currently borrowed books (no return date) along with author name and loaned member.',
    canonicalSql: `SELECT b.title, au.name AS author, l.member_name, l.loan_date
                   FROM library.loans l
                   JOIN library.books b ON b.book_id = l.book_id
                   JOIN library.authors au ON au.author_id = b.author_id
                   WHERE l.return_date IS NULL
                   ORDER BY l.loan_date DESC;`,
    tags: ['null checks', 'joins'],
  },
  {
    schemaSlug: 'finance',
    difficulty: 'hard',
    prompt: 'Identify accounts where total debits exceed credits and return the net outflow.',
    canonicalSql: `WITH txn_rollup AS (
                     SELECT account_id,
                            SUM(CASE WHEN txn_type = 'DEBIT' THEN amount ELSE 0 END) AS debits,
                            SUM(CASE WHEN txn_type = 'CREDIT' THEN amount ELSE 0 END) AS credits
                     FROM finance.transactions
                     GROUP BY account_id
                   )
                   SELECT a.holder_name, a.branch_code, (tr.debits - tr.credits) AS net_outflow
                   FROM txn_rollup tr
                   JOIN finance.accounts a ON a.account_id = tr.account_id
                   WHERE tr.debits > tr.credits
                   ORDER BY net_outflow DESC;`,
    tags: ['case', 'aggregation'],
    optimalityNotes: 'Single pass aggregation with CASE beats separate UNION queries.',
  },
  {
    schemaSlug: 'social',
    difficulty: 'medium',
    prompt: 'Find posts that received at least two reactions along with total reactions and author username.',
    canonicalSql: `SELECT p.post_id, u.username, COUNT(r.reaction_id) AS reactions
                   FROM social.posts p
                   JOIN social.users u ON u.user_id = p.user_id
                   JOIN social.reactions r ON r.post_id = p.post_id
                   GROUP BY p.post_id, u.username
                   HAVING COUNT(r.reaction_id) >= 2
                   ORDER BY reactions DESC;`,
    tags: ['having', 'aggregation'],
  },
];
