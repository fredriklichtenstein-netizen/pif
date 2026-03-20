
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log("Analyzing image:", imageUrl);

    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Analysis timed out")), 30000);
    });

    const analysisPromise = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes images of items being given away. Extract key information about the item."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: imageUrl,
              },
              {
                type: "text",
                text: "Analyze this image and provide a title, description, category (Furniture, Clothing, Electronics, etc), and condition (New, Good, Fair, Poor) for this item. Format your response as JSON."
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    // Race between the analysis and the timeout
    const response = await Promise.race([analysisPromise, timeoutPromise]) as Response;
    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid response from OpenAI");
    }

    console.log("Analysis completed successfully");
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("Error parsing AI response:", e);
      // If parsing fails, try to extract information using a more lenient approach
      const content = data.choices[0].message.content;
      parsedContent = {
        title: content.match(/title["']?\s*:?\s*["']([^"']+)["']/)?.[1] || "",
        description: content.match(/description["']?\s*:?\s*["']([^"']+)["']/)?.[1] || "",
        category: content.match(/category["']?\s*:?\s*["']([^"']+)["']/)?.[1] || "",
        condition: content.match(/condition["']?\s*:?\s*["']([^"']+)["']/)?.[1] || ""
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in analyze-image function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
