
const { Pool } = require('pg');
const connectionString = 'postgresql://internlink:internlink@localhost:5433/internlink';
const pool = new Pool({ connectionString });

async function checkDB() {
  try {
    console.log('=== Checking offers ===');
    const offers = await pool.query('SELECT * FROM offers');
    console.log('Offers:', offers.rows);

    console.log('\n=== Checking applications ===');
    const applications = await pool.query('SELECT * FROM applications');
    console.log('Applications:', applications.rows);

    console.log('\n=== Checking companies ===');
    const companies = await pool.query('SELECT * FROM companies');
    console.log('Companies:', companies.rows);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

checkDB();

