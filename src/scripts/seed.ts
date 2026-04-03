/**
 * Seeds databases: retail + hr (practice datasets) + sql_practice (curriculum meta).
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

    // ========== SQL_PRACTICE (curriculum meta) ==========
    await conn.query('CREATE DATABASE IF NOT EXISTS sql_practice');
    await conn.query('USE sql_practice');

    await conn.query('DROP TABLE IF EXISTS questions');
    await conn.query('DROP TABLE IF EXISTS levels');

    await conn.query(`
      CREATE TABLE levels (
        level_id    INT PRIMARY KEY,
        sort_order  INT NOT NULL UNIQUE,
        slug        VARCHAR(40) NOT NULL UNIQUE,
        title       VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        syntax      TEXT NOT NULL,
        patterns    TEXT NOT NULL,
        tips        TEXT NOT NULL
      )`);

    await conn.query(`
      CREATE TABLE questions (
        id            VARCHAR(16) PRIMARY KEY,
        level_id      INT NOT NULL,
        sort_order    INT NOT NULL,
        db            VARCHAR(64) NOT NULL,
        title         VARCHAR(200) NOT NULL,
        difficulty    ENUM('easy','medium','hard') NOT NULL,
        prompt        TEXT NOT NULL,
        hint          TEXT NOT NULL,
        canonical_sql TEXT NOT NULL,
        starter_sql   TEXT DEFAULT NULL,
        build_concept JSON NOT NULL,
        UNIQUE KEY uq_level_order (level_id, sort_order),
        FOREIGN KEY (level_id) REFERENCES levels(level_id)
      )`);

    // Seed levels
    for (const lvl of LEVELS) {
      await conn.query(
        `INSERT INTO levels (level_id, sort_order, slug, title, description, syntax, patterns, tips)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lvl.level_id, lvl.sort_order, lvl.slug, lvl.title, lvl.description, lvl.syntax, lvl.patterns, lvl.tips],
      );
    }
    console.log(`  ✓ Seeded ${LEVELS.length} levels`);

    // Seed questions
    for (const q of QUESTIONS) {
      await conn.query(
        `INSERT INTO questions (id, level_id, sort_order, db, title, difficulty, prompt, hint, canonical_sql, starter_sql, build_concept)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, q.level_id, q.sort_order, q.db, q.title, q.difficulty, q.prompt, q.hint, q.canonical_sql, q.starter_sql, JSON.stringify(q.build_concept)],
      );
    }
    console.log(`  ✓ Seeded ${QUESTIONS.length} questions`);

    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    console.log('Seed complete: retail, hr (3500-row fact tables) + sql_practice curriculum DB.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
