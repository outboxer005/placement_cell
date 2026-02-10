const http = require('http');

async function testLoginEndpoint() {
  console.log('Testing Admin Login API Endpoint...\n');

  const email = 'admin@vignan.edu';
  const password = 'vignan@123';
  const host = 'localhost';
  const port = 4000;

  const postData = JSON.stringify({ email, password });

  const options = {
    hostname: host,
    port: port,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log(`Testing: POST http://${host}:${port}/api/auth/login`);
  console.log('Credentials:');
  console.log('  Email:', email);
  console.log('  Password: ***');
  console.log('');

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      console.log(`Status Code: ${res.statusCode}`);
      console.log('Response Headers:');
      Object.keys(res.headers).forEach(key => {
        console.log(`  ${key}: ${res.headers[key]}`);
      });
      console.log('');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Body:');
        try {
          const json = JSON.parse(data);
          console.log(JSON.stringify(json, null, 2));

          if (res.statusCode === 200 && json.token) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('   Token received:', json.token.substring(0, 30) + '...');
            console.log('   Role:', json.role);
            console.log('   Name:', json.name);
          } else {
            console.log('\n❌ LOGIN FAILED');
            console.log('   Error:', json.error || 'Unknown error');
          }
        } catch (e) {
          console.log(data);
          console.log('\n❌ Could not parse JSON response');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      console.error('\nPossible causes:');
      console.error('  1. Server is not running (start with: npm run dev)');
      console.error('  2. Server is running on a different port');
      console.error('  3. Firewall blocking connection');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testLoginEndpoint().catch(err => {
  console.error('\nTest failed:', err.message);
  process.exit(1);
});
