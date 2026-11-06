const fs = require('fs');
const readline = require('readline');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Type your password and press Enter: ', (password) => {
    fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sales-0001@bxb-team.com', password: password })
    }).then(res => res.json()).then(auth => {
        if (auth.error) throw new Error(auth.error.message);
        return fetch(`${url}/rest/v1/profiles?select=*`, {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + auth.access_token }
        });
    }).then(res => res.json()).then(data => {
        console.log('\n--- PROFILE DATA ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--------------------');
        rl.close();
    }).catch(err => { console.error('\nError:', err.message); rl.close(); });
});
