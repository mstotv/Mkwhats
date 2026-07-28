const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase direct DB connection
// project ref: guqnvykbkfqqzxmpfegq
// Supabase connection pooler (port 6543) or direct (port 5432)
// Password is the DB password set during project creation
// We'll try the connection string approach with service_role key

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // Get all migration files sorted
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);
  
  // Supabase DB connection
  // The connection string for Supabase hosted project:
  // postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  // We need the DB password which is separate from the service key
  
  // Try using the combined SQL via the REST API's pg-meta endpoint
  // The service role key CAN be used with the pg-meta endpoint on some Supabase versions
  
  const projectRef = 'guqnvykbkfqqzxmpfegq';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cW52eWtia2ZxcXp4bXBmZWdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MjkwNywiZXhwIjoyMTAwODI4OTA3fQ.8IUB3sfGvhMauwLgSJP6elOU7yjwJ9V4ZO8ICE0_nys';

  const https = require('https');

  async function runSQL(sql) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ query: sql });
      const options = {
        hostname: `${projectRef}.supabase.co`,
        port: 443,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // Test connection first
  const test = await runSQL('SELECT 1 as test');
  console.log('Test response:', test.status, test.body.substring(0, 200));
}

runMigrations().catch(console.error);
