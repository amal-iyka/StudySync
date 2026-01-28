import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (allowedOrigin) {
    return allowedOrigin.split(',').map(o => o.trim());
  }
  // Default allowed origins for this project
  return [
    'http://localhost:5173',
    'http://localhost:3000'
  ];
};

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
};

// Input validation schema
const inviteCodeSchema = {
  validate: (code: unknown): { valid: boolean; error?: string; value?: string } => {
    if (typeof code !== 'string') {
      return { valid: false, error: 'Invite code must be a string' };
    }
    const trimmed = code.trim().toLowerCase();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Invite code is required' };
    }
    if (trimmed.length > 50) {
      return { valid: false, error: 'Invite code is too long' };
    }
    if (!/^[a-z0-9]+$/.test(trimmed)) {
      return { valid: false, error: 'Invite code must be alphanumeric' };
    }
    return { valid: true, value: trimmed };
  }
};

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate invite code
    const inviteCodeResult = inviteCodeSchema.validate((body as Record<string, unknown>)?.invite_code);
    if (!inviteCodeResult.valid) {
      return new Response(
        JSON.stringify({ error: inviteCodeResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invite_code = inviteCodeResult.value!;

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client with user's token to get their ID
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the group by invite code (using admin client to bypass RLS)
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('invite_code', invite_code)
      .single();

    if (groupError || !group) {
      console.log('Group lookup failed for code:', invite_code);
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabaseAdmin
      .from('group_memberships')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this group', group_id: group.id }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user to group as member
    const { error: joinError } = await supabaseAdmin
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      console.error('Join error:', joinError);
      return new Response(
        JSON.stringify({ error: 'Failed to join group' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} joined group ${group.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        group_id: group.id,
        group_name: group.name,
        message: `Successfully joined ${group.name}!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
