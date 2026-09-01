
const { Pool } = require('pg');

async function checkDb() {
  const pool = new Pool({ connectionString: 'postgresql://internlink:internlink@localhost:5433/internlink' });
  
  try {
    console.log('=== Connecting to Postgres ===');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n=== Tables in DB ===');
    console.log(tablesResult.rows.map(r => r.table_name));
    
    const usersResult = await pool.query('SELECT id, email, role FROM users');
    console.log('\n=== Users ===');
    console.log(usersResult.rows);
    
    const companiesResult = await pool.query('SELECT * FROM companies');
    console.log('\n=== Companies ===');
    console.log(companiesResult.rows);
    
    const offersResult = await pool.query('SELECT * FROM offers');
    console.log('\n=== Offers ===');
    console.log(offersResult.rows);
    
    const applicationsResult = await pool.query('SELECT * FROM applications');
    console.log('\n=== Applications ===');
    console.log(applicationsResult.rows);
    
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
