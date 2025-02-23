
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()

    // Call OpenAI's GPT-4 Vision model for better image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing images of furniture and household items. Focus on identifying the main item, its category, and visible condition. Respond with a JSON object containing title (brief item name), category (furniture/electronics/clothing/etc), condition (like new/good/fair), and a brief description focusing on notable features. Do not include measurements or specific dimensions in the description as these are handled separately."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What is this item? Describe it in detail but focus only on what you can see."
              },
              {
                type: "image_url",
                image_url: imageUrl
              }
            ]
          }
        ]
      })
    })

    const result = await response.json()
    const content = result.choices[0].message.content

    // Parse the JSON response
    const analysisResult = JSON.parse(content)

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze image', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
