/**
 * Seeds 5 databases (retail, hr, flights, analytics, finance).
 * Each has ≥5 tables; main fact table per DB has 3500 rows.
 * Run: npm run seed  (from backend/)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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
    const flat = part.flat();
    await conn.query(`INSERT INTO ${table} (${colList}) VALUES ${placeholders}`, flat);
  }
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

    await conn.query(`
      CREATE TABLE categories (
        category_id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE products (
        product_id INT PRIMARY KEY,
        category_id INT NOT NULL,
        sku VARCHAR(40) NOT NULL,
        list_price DECIMAL(10,2) NOT NULL,
        INDEX idx_cat (category_id)
      )`);
    await conn.query(`
      CREATE TABLE customers (
        customer_id INT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(120) NOT NULL,
        city VARCHAR(80) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE staff (
        staff_id INT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE orders (
        order_id INT PRIMARY KEY,
        customer_id INT NOT NULL,
        staff_id INT NOT NULL,
        order_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        INDEX idx_cust_date (customer_id, order_date),
        INDEX idx_status (status)
      )`);
    await conn.query(`
      CREATE TABLE order_items (
        order_item_id BIGINT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        qty INT NOT NULL,
        paid_price DECIMAL(10,2) NOT NULL,
        INDEX idx_order (order_id)
      )`);

    const cats: unknown[][] = [];
    for (let c = 1; c <= 20; c++) cats.push([c, `Category ${c}`]);
    await chunkInsert(conn, 'categories', ['category_id', 'name'], cats);

    const prods: unknown[][] = [];
    for (let p = 1; p <= 200; p++) {
      prods.push([p, 1 + (p % 20), `SKU-${p}`, 10 + (p % 50) + 0.99]);
    }
    await chunkInsert(conn, 'products', ['product_id', 'category_id', 'sku', 'list_price'], prods);

    const custs: unknown[][] = [];
    for (let c = 1; c <= 500; c++) {
      custs.push([c, `First${c}`, `Last${c}`, `u${c}@ex.com`, `City${(c % 50) + 1}`]);
    }
    await chunkInsert(conn, 'customers', ['customer_id', 'first_name', 'last_name', 'email', 'city'], custs);

    const staffRows: unknown[][] = [];
    for (let s = 1; s <= 40; s++) staffRows.push([s, `Staff ${s}`, s % 5 === 0 ? 'MANAGER' : 'CLERK']);
    await chunkInsert(conn, 'staff', ['staff_id', 'full_name', 'role'], staffRows);

    const ordersRows: unknown[][] = [];
    for (let oid = 1; oid <= 3400; oid++) {
      const cid = 1 + Math.floor(rand() * 500);
      const day = (oid * 17 + 3) % 365;
      const od = new Date(Date.UTC(2023, 0, 1 + day));
      const ds = od.toISOString().slice(0, 10);
      const st = oid % 3 === 0 ? 'CANCELLED' : 'COMPLETED';
      const sid = 1 + (oid % 40);
      ordersRows.push([oid, cid, sid, ds, st]);
    }
    for (let oid = 3401; oid <= 3500; oid++) {
      const dayInJune = (oid - 3401) % 28;
      const ds = `2023-06-${String(dayInJune + 1).padStart(2, '0')}`;
      ordersRows.push([oid, 42, 1 + (oid % 40), ds, 'COMPLETED']);
    }
    await chunkInsert(conn, 'orders', ['order_id', 'customer_id', 'staff_id', 'order_date', 'status'], ordersRows);

    const oi: unknown[][] = [];
    let oiid = 1;
    for (let oid = 1; oid <= 3500; oid++) {
      for (let k = 0; k < 2; k++) {
        const pid = 1 + ((oid + k) % 200);
        const qty = 1 + (oid % 4);
        const price = 15 + (oid % 30) + 0.5 * k;
        oi.push([oiid++, oid, pid, qty, price]);
      }
    }
    await chunkInsert(conn, 'order_items', ['order_item_id', 'order_id', 'product_id', 'qty', 'paid_price'], oi);

    // ========== HR ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS hr');
    await conn.query('USE hr');
    await conn.query('DROP TABLE IF EXISTS dept_manager');
    await conn.query('DROP TABLE IF EXISTS titles');
    await conn.query('DROP TABLE IF EXISTS salaries');
    await conn.query('DROP TABLE IF EXISTS dept_emp');
    await conn.query('DROP TABLE IF EXISTS employees');
    await conn.query('DROP TABLE IF EXISTS departments');

    await conn.query(`
      CREATE TABLE departments (
        dept_no VARCHAR(10) PRIMARY KEY,
        dept_name VARCHAR(100) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE employees (
        emp_no INT PRIMARY KEY,
        birth_date DATE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        hire_date DATE NOT NULL,
        gender CHAR(1) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE dept_emp (
        emp_no INT NOT NULL,
        dept_no VARCHAR(10) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        PRIMARY KEY (emp_no, dept_no, from_date),
        INDEX idx_dept (dept_no)
      )`);
    await conn.query(`
      CREATE TABLE salaries (
        emp_no INT NOT NULL,
        salary INT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        PRIMARY KEY (emp_no, from_date),
        INDEX idx_emp (emp_no),
        INDEX idx_dates (from_date, to_date)
      )`);
    await conn.query(`
      CREATE TABLE titles (
        emp_no INT NOT NULL,
        title VARCHAR(80) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        PRIMARY KEY (emp_no, title, from_date)
      )`);
    await conn.query(`
      CREATE TABLE dept_manager (
        dept_no VARCHAR(10) NOT NULL,
        emp_no INT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        PRIMARY KEY (dept_no, emp_no, from_date)
      )`);

    const depts: unknown[][] = [];
    for (let d = 1; d <= 10; d++) {
      const code = `d${String(d).padStart(3, '0')}`;
      depts.push([code, `Department ${d}`]);
    }
    await chunkInsert(conn, 'departments', ['dept_no', 'dept_name'], depts);

    const emps: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      emps.push([
        e,
        '1980-01-01',
        `F${e}`,
        `L${e}`,
        '2010-06-01',
        e % 2 === 0 ? 'M' : 'F',
      ]);
    }
    await chunkInsert(
      conn,
      'employees',
      ['emp_no', 'birth_date', 'first_name', 'last_name', 'hire_date', 'gender'],
      emps,
    );

    const deRows: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      const dept = e <= 220 ? 'd001' : `d${String(2 + (e % 9)).padStart(3, '0')}`;
      deRows.push([e, dept, '2010-06-01', '2099-01-01']);
    }
    await chunkInsert(conn, 'dept_emp', ['emp_no', 'dept_no', 'from_date', 'to_date'], deRows);

    const salRows: unknown[][] = [];
    const emp101: unknown[][] = [
      [101, 88000, '2020-03-01', '2021-03-01'],
      [101, 91000, '2021-03-01', '2022-03-01'],
      [101, 94000, '2022-03-01', '2023-03-01'],
      [101, 97000, '2023-03-01', '2024-03-01'],
      [101, 99000, '2024-03-01', '2099-01-01'],
    ];
    for (let i = 0; i < 3495; i++) {
      let emp = 1 + (i % 400);
      if (emp === 101) emp = 102;
      const from = new Date(Date.UTC(2000, 0, 1));
      from.setUTCDate(from.getUTCDate() + i);
      const fromStr = from.toISOString().slice(0, 10);
      let salary = 55000 + (i * 73) % 90000;
      let toStr = i % 17 === 0 ? '2099-01-01' : '2021-06-01';
      if (emp === 333) {
        salary = 200000;
        toStr = '2099-01-01';
      }
      salRows.push([emp, salary, fromStr, toStr]);
    }
    for (const row of emp101) salRows.push(row);
    await chunkInsert(conn, 'salaries', ['emp_no', 'salary', 'from_date', 'to_date'], salRows);

    const tit: unknown[][] = [];
    for (let e = 1; e <= 400; e++) {
      tit.push([e, e % 10 === 0 ? 'Manager' : 'Engineer', '2010-06-01', '2099-01-01']);
    }
    await chunkInsert(conn, 'titles', ['emp_no', 'title', 'from_date', 'to_date'], tit);

    const dm: unknown[][] = [];
    for (let d = 1; d <= 10; d++) {
      const code = `d${String(d).padStart(3, '0')}`;
      dm.push([code, d, '2015-01-01', '2099-01-01']);
    }
    await chunkInsert(conn, 'dept_manager', ['dept_no', 'emp_no', 'from_date', 'to_date'], dm);

    // ========== FLIGHTS ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS flights');
    await conn.query('USE flights');
    await conn.query('DROP TABLE IF EXISTS flights');
    await conn.query('DROP TABLE IF EXISTS routes');
    await conn.query('DROP TABLE IF EXISTS aircraft');
    await conn.query('DROP TABLE IF EXISTS airports');
    await conn.query('DROP TABLE IF EXISTS airlines');

    await conn.query(`
      CREATE TABLE airlines (
        carrier VARCHAR(10) PRIMARY KEY,
        name VARCHAR(120) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE airports (
        faa VARCHAR(3) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        lat DECIMAL(9,4),
        lon DECIMAL(9,4)
      )`);
    await conn.query(`
      CREATE TABLE aircraft (
        tail VARCHAR(10) PRIMARY KEY,
        carrier VARCHAR(10) NOT NULL,
        model VARCHAR(60) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE routes (
        route_id INT PRIMARY KEY,
        origin VARCHAR(3) NOT NULL,
        dest VARCHAR(3) NOT NULL,
        miles INT NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE flights (
        flight_id INT PRIMARY KEY,
        carrier VARCHAR(10) NOT NULL,
        origin VARCHAR(3) NOT NULL,
        dest VARCHAR(3) NOT NULL,
        air_time INT NOT NULL,
        dep_ts DATETIME NOT NULL,
        route_id INT,
        INDEX idx_carrier_time (carrier, dep_ts),
        INDEX idx_origin (origin)
      )`);

    const carriers: unknown[][] = [
      ['AA', 'Alpha Air'],
      ['DL', 'Delta Lite'],
    ];
    for (let i = 2; i < 25; i++) carriers.push([`X${i}`, `Airline ${i}`]);
    await chunkInsert(conn, 'airlines', ['carrier', 'name'], carriers);

    const aps: unknown[][] = [];
    for (let i = 0; i < 30; i++) {
      const faa = String(i).padStart(3, '0');
      aps.push([faa, `Airport ${i}`, 40 + i * 0.1, -70 - i * 0.1]);
    }
    await chunkInsert(conn, 'airports', ['faa', 'name', 'lat', 'lon'], aps);

    const ac: unknown[][] = [];
    for (let i = 0; i < 50; i++) {
      ac.push([`N${String(i).padStart(4, '0')}`, i % 2 === 0 ? 'AA' : 'DL', 'B737']);
    }
    await chunkInsert(conn, 'aircraft', ['tail', 'carrier', 'model'], ac);

    const rt: unknown[][] = [];
    for (let r = 1; r <= 100; r++) {
      const o = String((r * 3) % 30).padStart(3, '0');
      const d = String((r * 7) % 30).padStart(3, '0');
      rt.push([r, o, d, 500 + (r % 2000)]);
    }
    await chunkInsert(conn, 'routes', ['route_id', 'origin', 'dest', 'miles'], rt);

    const fl: unknown[][] = [];
    for (let fid = 1; fid <= 3500; fid++) {
      const car = fid <= 2300 ? 'AA' : 'DL';
      const o = String((fid * 11) % 30).padStart(3, '0');
      const dst = String((fid * 13) % 30).padStart(3, '0');
      const at = fid === 1 ? 700 : 60 + (fid % 400);
      let dep: Date;
      if (car === 'DL' && fid > 2300) {
        dep = new Date(Date.UTC(2024, (fid % 5), 1 + (fid % 26), 14, 0, 0));
      } else {
        dep = new Date(Date.UTC(2024, (fid % 12), 1 + (fid % 27), 10, 0, 0));
      }
      const depStr = dep.toISOString().slice(0, 19).replace('T', ' ');
      fl.push([fid, car, o, dst, at, depStr, 1 + (fid % 100)]);
    }
    await chunkInsert(
      conn,
      'flights',
      ['flight_id', 'carrier', 'origin', 'dest', 'air_time', 'dep_ts', 'route_id'],
      fl,
    );

    // ========== ANALYTICS ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS analytics');
    await conn.query('USE analytics');
    await conn.query('DROP TABLE IF EXISTS page_views');
    await conn.query('DROP TABLE IF EXISTS sessions');
    await conn.query('DROP TABLE IF EXISTS campaigns');
    await conn.query('DROP TABLE IF EXISTS dim_source');
    await conn.query('DROP TABLE IF EXISTS users');

    await conn.query(`
      CREATE TABLE dim_source (
        source_id INT PRIMARY KEY,
        name VARCHAR(80) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE campaigns (
        campaign_id INT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        source_id INT NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE users (
        user_id INT PRIMARY KEY,
        country VARCHAR(60) NOT NULL,
        signup_ts DATETIME NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE sessions (
        session_id BIGINT PRIMARY KEY,
        user_id INT NOT NULL,
        campaign_id INT,
        started_at DATETIME NOT NULL,
        INDEX idx_user (user_id)
      )`);
    await conn.query(`
      CREATE TABLE page_views (
        view_id BIGINT PRIMARY KEY,
        session_id BIGINT NOT NULL,
        user_id INT NOT NULL,
        page_path VARCHAR(200) NOT NULL,
        view_ts DATETIME NOT NULL,
        INDEX idx_user_path (user_id, page_path, view_ts)
      )`);

    const srcs: unknown[][] = [];
    for (let s = 1; s <= 10; s++) srcs.push([s, `Source ${s}`]);
    await chunkInsert(conn, 'dim_source', ['source_id', 'name'], srcs);

    const camps: unknown[][] = [];
    for (let c = 1; c <= 20; c++) camps.push([c, `Camp ${c}`, 1 + (c % 10)]);
    await chunkInsert(conn, 'campaigns', ['campaign_id', 'name', 'source_id'], camps);

    const users: unknown[][] = [];
    for (let u = 1; u <= 200; u++) {
      const country = u <= 120 ? 'US' : u <= 160 ? 'UK' : 'DE';
      users.push([u, country, '2023-01-01 00:00:00']);
    }
    await chunkInsert(conn, 'users', ['user_id', 'country', 'signup_ts'], users);

    const sess: unknown[][] = [];
    for (let s = 1; s <= 2500; s++) {
      const uid = 1 + (s % 200);
      sess.push([BigInt(100000 + s), uid, 1 + (s % 20), '2024-01-01 12:00:00']);
    }
    await chunkInsert(conn, 'sessions', ['session_id', 'user_id', 'campaign_id', 'started_at'], sess);

    const pv: unknown[][] = [];
    let vid = 1;
    const r2 = mulberry32(777);
    for (let k = 0; k < 3500; k++) {
      let uid: number;
      if (k < 2100) uid = 1 + (k % 120);
      else uid = 1 + Math.floor(r2() * 200);
      const sid = BigInt(100000 + ((k * 17) % 2500) + 1);
      const path = k % 11 === 0 ? '/checkout' : k % 5 === 0 ? '/home' : '/product';
      const ts = new Date(Date.UTC(2024, k % 12, 1 + (k % 27), 12, 0, 0));
      if (k < 8) {
        pv.push([vid++, sid, 50, '/checkout', '2024-03-15 10:00:00']);
        continue;
      }
      pv.push([vid++, sid, uid, path, ts.toISOString().slice(0, 19).replace('T', ' ')]);
    }
    await chunkInsert(
      conn,
      'page_views',
      ['view_id', 'session_id', 'user_id', 'page_path', 'view_ts'],
      pv,
    );

    // ========== FINANCE ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS finance');
    await conn.query('USE finance');
    await conn.query('DROP TABLE IF EXISTS transactions');
    await conn.query('DROP TABLE IF EXISTS accounts');
    await conn.query('DROP TABLE IF EXISTS products');
    await conn.query('DROP TABLE IF EXISTS customers_fin');
    await conn.query('DROP TABLE IF EXISTS branches');
    await conn.query('DROP TABLE IF EXISTS fx_rates');

    await conn.query(`
      CREATE TABLE branches (
        branch_id INT PRIMARY KEY,
        city VARCHAR(80) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE customers_fin (
        customer_id INT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        segment VARCHAR(40) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE products (
        product_id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rate_annual DECIMAL(6,4) NOT NULL
      )`);
    await conn.query(`
      CREATE TABLE accounts (
        account_id INT PRIMARY KEY,
        customer_id INT NOT NULL,
        branch_id INT NOT NULL,
        account_type VARCHAR(20) NOT NULL,
        balance DECIMAL(14,2) NOT NULL,
        INDEX idx_type (account_type)
      )`);
    await conn.query(`
      CREATE TABLE transactions (
        txn_id BIGINT PRIMARY KEY,
        account_id INT NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        txn_type VARCHAR(10) NOT NULL,
        posted_at DATETIME NOT NULL,
        INDEX idx_acct_time (account_id, posted_at)
      )`);
    await conn.query(`
      CREATE TABLE fx_rates (
        ccy VARCHAR(3) PRIMARY KEY,
        usd_rate DECIMAL(10,6) NOT NULL
      )`);

    const br: unknown[][] = [];
    for (let b = 1; b <= 25; b++) br.push([b, `City ${b}`]);
    await chunkInsert(conn, 'branches', ['branch_id', 'city'], br);

    const cf: unknown[][] = [];
    for (let c = 1; c <= 800; c++) cf.push([c, `Cust ${c}`, c % 3 === 0 ? 'RETAIL' : 'SMB']);
    await chunkInsert(conn, 'customers_fin', ['customer_id', 'name', 'segment'], cf);

    const pr: unknown[][] = [];
    for (let p = 1; p <= 30; p++) pr.push([p, `Loan ${p}`, 0.05 + (p % 10) * 0.001]);
    await chunkInsert(conn, 'products', ['product_id', 'name', 'rate_annual'], pr);

    const acc: unknown[][] = [];
    for (let a = 1; a <= 500; a++) {
      const typ = a % 3 === 0 ? 'CHECKING' : a % 3 === 1 ? 'SAVINGS' : 'LOAN';
      acc.push([a, 1 + (a % 800), 1 + (a % 25), typ, -10000 + (a * 137) % 20000]);
    }
    await chunkInsert(
      conn,
      'accounts',
      ['account_id', 'customer_id', 'branch_id', 'account_type', 'balance'],
      acc,
    );

    const fx: unknown[][] = [
      ['USD', 1],
      ['EUR', 1.08],
    ];
    await chunkInsert(conn, 'fx_rates', ['ccy', 'usd_rate'], fx);

    const tx: unknown[][] = [];
    let tid = 1;
    for (let i = 0; i < 3460; i++) {
      const aid = 101 + (i % 399);
      const amt = (i % 2 === 0 ? 1 : -1) * (10 + (i % 500));
      const typ = amt < 0 ? 'DEBIT' : 'CREDIT';
      const dt = new Date(Date.UTC(2024, i % 12, 1 + (i % 28), 9, 0, 0));
      tx.push([tid++, aid, amt, typ, dt.toISOString().slice(0, 19).replace('T', ' ')]);
    }
    for (let i = 1; i <= 20; i++) {
      tx.push([
        tid++,
        100,
        i % 2 === 0 ? 100 : -40,
        i % 2 === 0 ? 'CREDIT' : 'DEBIT',
        `2024-${String(1 + (i % 9)).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')} 10:00:00`,
      ]);
    }
    for (let j = 0; j < 20; j++) {
      tx.push([
        tid++,
        200,
        -30 - j,
        'DEBIT',
        `2024-06-${String(1 + (j % 28)).padStart(2, '0')} 14:00:00`,
      ]);
    }
    await chunkInsert(conn, 'transactions', ['txn_id', 'account_id', 'amount', 'txn_type', 'posted_at'], tx);

    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    console.log('Seed complete: retail, hr, flights, analytics, finance (3500-row fact tables).');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
