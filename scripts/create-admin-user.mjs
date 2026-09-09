// One-off helper to create the admin login user via the Supabase Admin API.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin-user.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  email_confirm: true,
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Created admin user:", data.user.id, data.user.email);
