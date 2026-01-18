const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually to avoid dotenv dependency if not present
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUser(email) {
    console.log(`Checking ${email}...`);
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);
    if (user) {
        console.log('Found user in Auth:', {
            id: user.id,
            email: user.email,
            confirmed: !!user.email_confirmed_at,
            last_sign_in: user.last_sign_in_at,
            metadata: user.user_metadata
        });
    } else {
        console.log(`User ${email} NOT found in Auth.`);
    }
}

async function run() {
    await checkUser('maemurilo@hotmail.com');
    await checkUser('julia@hotmail.com');
}

run();
