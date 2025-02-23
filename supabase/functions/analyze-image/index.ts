
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const TIMEOUT_MS = 30000; // 30 seconds timeout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a controller for the timeout
const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { controller, timeout } = createTimeoutController(TIMEOUT_MS);

  try {
    const { imageUrl } = await req.json();
    console.log('Analyzing image:', imageUrl);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using the faster model
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes images of items that people want to give away. Provide a concise title, brief description, category (from: Furniture, Electronics, Clothing, Books, Home & Garden, Shoes, Toys, Children's Clothing, Other), and condition (from: New, Like New, Good, Fair, Well Loved) for the item in the image. Respond quickly and efficiently."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image? Provide the details in JSON format with title, description, category, and condition fields. Be brief and concise." },
              { type: "image_url", url: imageUrl }
            ]
          }
        ],
        max_tokens: 250, // Reduced token limit for faster response
        temperature: 0.7,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    console.log('Analysis completed successfully');
    
    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse GPT response:', e);
      analysis = {
        title: "Item",
        description: "Could not analyze image properly",
        category: "Other",
        condition: "Good"
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Error in analyze-image function:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'Analysis timeout - please try again',
        title: "Item",
        description: "Image analysis timed out",
        category: "Other",
        condition: "Good"
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      title: "Item",
      description: "Failed to analyze image",
      category: "Other",
      condition: "Good"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
