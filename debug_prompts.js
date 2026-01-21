
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    const { data: prompts, error } = await supabase
        .from('prompts_ia')
        .select('*')
        .in('id', [17, 18]);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(prompts, null, 2));
}

debug();
