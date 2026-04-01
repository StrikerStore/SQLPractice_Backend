/**
 * Canonical answers for auto-grading. Must match seeded data in scripts/seed.ts.
 * IDs: #R01–#R05 retail, #H01–#H05 hr, #F01–#F05 flights, #A01–#A05 analytics, #B01–#B05 finance
 */
export const CANONICAL_QUERIES: Record<string, string> = {
  // --- RETAIL ---
  '#R01': `
    SELECT COUNT(*) AS cnt
    FROM orders
    WHERE status = 'COMPLETED'
  `,
  '#R02': `
    WITH cust_counts AS (
      SELECT customer_id, COUNT(*) AS order_cnt
      FROM orders
      GROUP BY customer_id
    )
    SELECT COUNT(*) AS cust_above_five
    FROM cust_counts
    WHERE order_cnt > 5
  `,
  '#R03': `
    SELECT customer_id
    FROM (
      SELECT customer_id,
        ROW_NUMBER() OVER (ORDER BY cnt DESC, customer_id ASC) AS rn
      FROM (
        SELECT customer_id, COUNT(*) AS cnt
        FROM orders
        GROUP BY customer_id
      ) x
    ) t
    WHERE rn = 1
  `,
  '#R04': `
    SELECT customer_id
    FROM customers c
    WHERE (
      SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id
    ) > (
      SELECT AVG(oc) FROM (
        SELECT COUNT(*) AS oc FROM orders GROUP BY customer_id
      ) x
    )
    ORDER BY customer_id
    LIMIT 10
  `,
  '#R05': `
    SELECT COUNT(*) AS cnt
    FROM orders
    WHERE customer_id = 42
      AND order_date >= '2023-06-01'
      AND order_date < '2023-07-01'
  `,

  // --- HR ---
  '#H01': `
    SELECT d.dept_name
    FROM employees e
    JOIN dept_emp de ON e.emp_no = de.emp_no
    JOIN departments d ON de.dept_no = d.dept_no
    GROUP BY d.dept_no, d.dept_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `,
  '#H02': `
    SELECT emp_no
    FROM (
      SELECT emp_no,
        ROW_NUMBER() OVER (ORDER BY salary DESC, emp_no ASC) AS rn
      FROM salaries
      WHERE to_date > CURDATE()
    ) t
    WHERE rn = 1
  `,
  '#H03': `
    WITH current_sal AS (
      SELECT emp_no, salary
      FROM salaries
      WHERE to_date > CURDATE()
    )
    SELECT AVG(salary) AS avg_current_salary
    FROM current_sal
  `,
  '#H04': `
    SELECT e.emp_no
    FROM employees e
    WHERE EXISTS (
      SELECT 1 FROM salaries s
      WHERE s.emp_no = e.emp_no AND s.salary > 95000 AND s.to_date > CURDATE()
    )
    ORDER BY e.emp_no
    LIMIT 5
  `,
  '#H05': `
    SELECT COUNT(*) AS cnt
    FROM salaries
    WHERE emp_no = 101
      AND from_date >= '2020-01-01'
      AND from_date < '2025-01-01'
  `,

  // --- FLIGHTS ---
  '#F01': `
    SELECT a.name
    FROM flights f
    JOIN airlines a ON f.carrier = a.carrier
    GROUP BY a.carrier, a.name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `,
  '#F02': `
    SELECT flight_id
    FROM (
      SELECT flight_id,
        ROW_NUMBER() OVER (ORDER BY air_time DESC, flight_id ASC) AS rn
      FROM flights
    ) t
    WHERE rn = 1
  `,
  '#F03': `
    WITH long_flights AS (
      SELECT * FROM flights WHERE air_time >= 180
    )
    SELECT COUNT(*) AS cnt FROM long_flights
  `,
  '#F04': `
    SELECT origin
    FROM flights
    GROUP BY origin
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `,
  '#F05': `
    SELECT COUNT(*) AS cnt
    FROM flights
    WHERE carrier = 'DL'
      AND dep_ts >= '2024-01-01 00:00:00'
      AND dep_ts < '2024-07-01 00:00:00'
  `,

  // --- ANALYTICS ---
  '#A01': `
    SELECT u.country
    FROM page_views pv
    JOIN users u ON pv.user_id = u.user_id
    GROUP BY u.country
    ORDER BY COUNT(DISTINCT pv.session_id) DESC
    LIMIT 1
  `,
  '#A02': `
    SELECT session_id
    FROM (
      SELECT session_id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY view_ts DESC, session_id DESC) AS rn
      FROM page_views
    ) t
    WHERE rn = 1
    ORDER BY session_id ASC
    LIMIT 1
  `,
  '#A03': `
    WITH per_session AS (
      SELECT session_id, COUNT(*) AS views
      FROM page_views
      GROUP BY session_id
    )
    SELECT MAX(views) AS max_views_one_session FROM per_session
  `,
  '#A04': `
    SELECT user_id
    FROM (
      SELECT user_id, COUNT(*) AS vc
      FROM page_views
      GROUP BY user_id
    ) t
    WHERE vc > (
      SELECT AVG(cnt) FROM (
        SELECT COUNT(*) AS cnt FROM page_views GROUP BY user_id
      ) z
    )
    ORDER BY user_id
    LIMIT 5
  `,
  '#A05': `
    SELECT COUNT(*) AS cnt
    FROM page_views
    WHERE user_id = 50
      AND page_path = '/checkout'
      AND view_ts >= '2024-03-01'
      AND view_ts < '2024-04-01'
  `,

  // --- FINANCE ---
  '#B01': `
    SELECT a.account_type
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    WHERE t.posted_at >= '2024-01-01'
      AND t.posted_at < '2025-01-01'
    GROUP BY a.account_type
    ORDER BY SUM(t.amount) ASC
    LIMIT 1
  `,
  '#B02': `
    SELECT running_sum
    FROM (
      SELECT SUM(amount) OVER (
        PARTITION BY account_id ORDER BY posted_at, txn_id
      ) AS running_sum,
        ROW_NUMBER() OVER (ORDER BY posted_at, txn_id) AS rn
      FROM transactions
      WHERE account_id = 100
    ) t
    WHERE rn = 1
  `,
  '#B03': `
    WITH monthly AS (
      SELECT DATE_FORMAT(posted_at, '%Y-%m') AS ym, SUM(amount) AS flow
      FROM transactions
      GROUP BY DATE_FORMAT(posted_at, '%Y-%m')
    )
    SELECT ym FROM monthly ORDER BY flow DESC LIMIT 1
  `,
  '#B04': `
    SELECT account_id
    FROM accounts a
    WHERE ABS(a.balance) > (
      SELECT AVG(ABS(balance)) FROM accounts
    )
    ORDER BY account_id
    LIMIT 3
  `,
  '#B05': `
    SELECT COUNT(*) AS cnt
    FROM transactions
    WHERE account_id = 200
      AND txn_type = 'DEBIT'
      AND posted_at >= '2024-06-01'
      AND posted_at < '2024-07-01'
  `,
};
