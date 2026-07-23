import { Router, Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

export const importRouter = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── Detect platform from URL ────────────────────────────────
function detectPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'website';
}

// ─── Import Recipe from Social Media URL ──────────────────────
importRouter.post('/recipe', async (req: Request, res: Response) => {
  const { userId, sourceUrl } = req.body;

  if (!userId || !sourceUrl) {
    return res.status(400).json({ error: 'userId and sourceUrl are required' });
  }

  const platform = detectPlatform(sourceUrl);

  // Create import record
  const { data: importRecord, error: insertError } = await supabase
    .from('imported_recipes')
    .insert({
      user_id: userId,
      source_url: sourceUrl,
      platform,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: 'Failed to create import record' });

  // Process asynchronously
  processImport(importRecord.id, sourceUrl, platform, userId);

  return res.json({
    message: 'Import started. Gagawin na namin ito para sa iyo!',
    importId: importRecord.id,
    status: 'processing',
  });
});

// ─── Check Import Status ──────────────────────────────────────
importRouter.get('/status/:importId', async (req: Request, res: Response) => {
  const { importId } = req.params;

  const { data, error } = await supabase
    .from('imported_recipes')
    .select('*, recipes(*)')
    .eq('id', importId)
    .single();

  if (error) return res.status(404).json({ error: 'Import not found' });

  return res.json({ import: data });
});

// ─── Async Import Processor ───────────────────────────────────
async function processImport(importId: string, sourceUrl: string, platform: string, userId: string) {
  try {
    let transcript = '';

    if (platform === 'youtube') {
      // For YouTube, try to get video description/captions via oEmbed
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
      const { data } = await axios.get(oembedUrl);
      transcript = `Title: ${data.title}\nAuthor: ${data.author_name}`;
    } else {
      // For TikTok/Instagram, use the URL itself as context
      // In production: integrate with a video transcript API
      transcript = `Video URL: ${sourceUrl}\nPlatform: ${platform}`;
    }

    // Use Gemini to extract recipe from available context
    const prompt = `Extract a Filipino recipe from this social media content. If you cannot determine a specific recipe from the URL alone, create a reasonable Filipino recipe that would be typical for this type of content.

Content: ${transcript}
Source URL: ${sourceUrl}
Platform: ${platform}

Return a JSON recipe object with: title, title_local, description, ingredients (with name_local, quantity, unit), instructions (step, text), prep_time, cook_time, servings, dietary_tags, tips. Include Filipino ingredient names. All costs in Philippine Peso (₱).

If you truly cannot extract a recipe, return: { "error": "Cannot extract recipe from this content" }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) {
      await supabase.from('imported_recipes').update({
        status: 'review_needed',
        error_message: parsed.error,
        parsed_recipe: null,
      }).eq('id', importId);
      return;
    }

    await supabase.from('imported_recipes').update({
      status: 'completed',
      raw_transcript: transcript,
      parsed_recipe: parsed,
    }).eq('id', importId);

  } catch (err: any) {
    console.error('[Import] Error processing:', err.message);
    await supabase.from('imported_recipes').update({
      status: 'failed',
      error_message: err.message,
    }).eq('id', importId);
  }
}
