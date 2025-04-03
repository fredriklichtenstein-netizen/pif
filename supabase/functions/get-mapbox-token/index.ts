
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    console.log("Edge function: Token exists:", !!token);
    
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN environment variable not set');
      throw new Error('Mapbox token not configured in environment variables');
    }

    return new Response(
      JSON.stringify({ 
        token,
        expiresIn: 3600 // 1 hour in seconds
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=3600' // Allow caching for 1 hour
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in get-mapbox-token function:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
