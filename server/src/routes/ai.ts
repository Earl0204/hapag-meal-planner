import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

export const aiRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── Check AI credit limit ────────────────────────────────────
async function checkCredits(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { data } = await supabase
    .from('profiles')
    .select('ai_credits_used, ai_credits_limit, plan')
    .eq('id', userId)
    .single();

  if (!data) return { allowed: false, used: 0, limit: 0 };
  if (data.ai_credits_limit === -1) return { allowed: true, used: data.ai_credits_used, limit: -1 }; // Ultra = unlimited
  return {
    allowed: data.ai_credits_used < data.ai_credits_limit,
    used: data.ai_credits_used,
    limit: data.ai_credits_limit,
  };
}

async function incrementCredits(userId: string) {
  await supabase.rpc('increment_ai_credits', { user_id: userId });
}

// ─── Generate Recipe from Pantry Items ────────────────────────
aiRouter.post('/generate-recipe', async (req: Request, res: Response) => {
  const { userId, ingredients, dietaryRestrictions = [], servings = 4 } = req.body;

  const credits = await checkCredits(userId);
  if (!credits.allowed) {
    return res.status(403).json({
      error: 'AI credit limit reached. Upgrade to Pro or Ultra for more credits.',
      credits,
    });
  }

  const prompt = `You are a Filipino home cooking expert. Generate a complete, authentic Filipino recipe using ONLY these available ingredients:
  
Available ingredients: ${ingredients.join(', ')}
Dietary restrictions: ${dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'none'}
Servings: ${servings}

Rules:
- Prioritize Filipino dishes (adobo, sinigang, ginisa, etc.)
- Use Mama Sita's or local seasonings when relevant
- Include Filipino ingredient names alongside English names
- Estimate cost in Philippine Peso (₱)
- Use simple home cooking techniques

Return a JSON object with this exact structure:
{
  "title": "Recipe Name",
  "title_local": "Filipino Name",
  "description": "Brief appetizing description",
  "cuisine_type": "Filipino",
  "difficulty": "easy|medium|hard",
  "difficulty_local": "Madali|Katamtaman|Mahirap",
  "prep_time": 15,
  "cook_time": 30,
  "total_time": 45,
  "servings": 4,
  "cost_estimate_min": 250,
  "cost_estimate_max": 400,
  "meal_type": ["lunch", "dinner"],
  "dietary_tags": [],
  "ingredients": [
    {
      "name": "Chicken",
      "name_local": "Manok",
      "quantity": 1,
      "unit": "kg",
      "preparation": "cut into pieces",
      "estimated_price": 200,
      "is_optional": false
    }
  ],
  "instructions": [
    { "step": 1, "text": "Step instruction here", "duration_minutes": 5 }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "mama_sita_products": ["Sinigang Mix", "Oyster Sauce"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const recipe = JSON.parse(jsonMatch[0]);

    // Log AI usage
    await supabase.from('ai_generations').insert({
      user_id: userId,
      generation_type: 'recipe',
      prompt_summary: `Ingredients: ${ingredients.slice(0, 5).join(', ')}`,
      result_summary: recipe.title,
      model: 'gemini-1.5-flash',
      status: 'success',
    });

    await incrementCredits(userId);

    return res.json({ recipe, credits: { ...credits, used: credits.used + 1 } });
  } catch (err: any) {
    console.error('[AI] Recipe generation error:', err.message);

    await supabase.from('ai_generations').insert({
      user_id: userId,
      generation_type: 'recipe',
      prompt_summary: `Ingredients: ${ingredients.slice(0, 5).join(', ')}`,
      model: 'gemini-1.5-flash',
      status: 'failed',
    });

    return res.status(500).json({ error: 'AI recipe generation failed. Subukan ulit.' });
  }
});

// ─── Generate Weekly Meal Plan ────────────────────────────────
aiRouter.post('/generate-meal-plan', async (req: Request, res: Response) => {
  const { userId, dietaryPreferences = [], weeklyBudget, calorieTarget, householdSize = 4 } = req.body;

  const credits = await checkCredits(userId);
  if (!credits.allowed) {
    return res.status(403).json({ error: 'AI credit limit reached. I-upgrade ang inyong plan.', credits });
  }

  const prompt = `Create a complete Filipino weekly meal plan (7 days) for a family of ${householdSize}.

Budget: ₱${weeklyBudget || 3000} for the week
Calorie target per day: ${calorieTarget || 2000} calories per person
Dietary preferences: ${dietaryPreferences.length ? dietaryPreferences.join(', ') : 'none'}

Requirements:
- All meals must be Filipino dishes
- Include Almusal (breakfast), Tanghalian (lunch), Merienda (snack), Hapunan (dinner) for each day
- Stay within the weekly budget
- Vary proteins (chicken, pork, fish, beef, vegetables)
- Reference Mama Sita's, Panlasang Pinoy-style dishes
- Each meal should show estimated cost in ₱

Return JSON:
{
  "weekly_budget_estimate": 2800,
  "days": [
    {
      "day": "Lunes",
      "date_offset": 0,
      "meals": {
        "almusal": { "name": "Tapsilog", "cost": 120, "calories": 650 },
        "tanghalian": { "name": "Chicken Adobo", "cost": 280, "calories": 450 },
        "merienda": { "name": "Pandesal", "cost": 30, "calories": 200 },
        "hapunan": { "name": "Sinigang na Isda", "cost": 320, "calories": 380 }
      },
      "day_total_cost": 750,
      "day_total_calories": 1680
    }
  ],
  "grocery_items": [
    { "name": "Chicken", "name_local": "Manok", "quantity": 2, "unit": "kg", "estimated_price": 400 }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const mealPlan = JSON.parse(jsonMatch[0]);

    await supabase.from('ai_generations').insert({
      user_id: userId,
      generation_type: 'meal_plan',
      prompt_summary: `Budget: ₱${weeklyBudget}, ${householdSize} people`,
      result_summary: '7-day Filipino meal plan',
      model: 'gemini-1.5-flash',
      status: 'success',
    });

    await incrementCredits(userId);

    return res.json({ mealPlan, credits: { ...credits, used: credits.used + 1 } });
  } catch (err: any) {
    console.error('[AI] Meal plan error:', err.message);
    return res.status(500).json({ error: 'Nabigo ang AI. Subukan ulit mamaya.' });
  }
});

// ─── Generate SEO Metadata for Recipe ────────────────────────
aiRouter.post('/generate-seo', async (req: Request, res: Response) => {
  const { recipeTitle, description, ingredients } = req.body;

  const prompt = `Generate SEO metadata for a Filipino recipe page.
Recipe: ${recipeTitle}
Description: ${description}
Main ingredients: ${ingredients?.join(', ')}

Return JSON: {
  "seo_title": "optimized title under 60 chars",
  "seo_description": "compelling meta description under 155 chars",
  "keywords": ["keyword1", "keyword2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    return res.json(JSON.parse(jsonMatch[0]));
  } catch {
    return res.status(500).json({ error: 'SEO generation failed' });
  }
});
