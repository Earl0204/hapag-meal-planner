import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Recipe {
  id: string;
  title: string;
  title_local: string | null;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  difficulty_local: string | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  servings: number;
  cost_estimate_min: number | null;
  cost_estimate_max: number | null;
  calories_per_serving: number | null;
  meal_type: string[];
  dietary_tags: string[];
  is_ai_generated: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  save_count: number;
  mama_sita_products: string[] | null;
}

export const SEED_FILIPINO_RECIPES: Recipe[] = [
  {
    id: 'r-1',
    title: 'Adobong Manok at Baboy',
    title_local: 'Chicken & Pork Adobo',
    description: 'Classic Filipino savory stew made with chicken and pork belly simmered in soy sauce, vinegar, garlic, bay leaves, and black peppercorns.',
    image_url: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&q=80&fit=crop',
    cuisine_type: 'Filipino',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 15,
    cook_time: 45,
    total_time: 60,
    servings: 6,
    cost_estimate_min: 280,
    cost_estimate_max: 350,
    calories_per_serving: 420,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['High-Protein'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.9,
    rating_count: 128,
    save_count: 340,
    mama_sita_products: ['Mama Sita\'s Soy Sauce', 'Mama Sita\'s Vinegar'],
  },
  {
    id: 'r-2',
    title: 'Sinigang na Baboy',
    title_local: 'Pork Tamarind Soup',
    description: 'Comforting Filipino sour soup cooked with tender pork ribs, kangkong, radish, eggplant, and green chili in tamarind broth.',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80&fit=crop',
    cuisine_type: 'Filipino',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 20,
    cook_time: 50,
    total_time: 70,
    servings: 6,
    cost_estimate_min: 300,
    cost_estimate_max: 380,
    calories_per_serving: 380,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Soup'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.95,
    rating_count: 142,
    save_count: 410,
    mama_sita_products: ['Mama Sita\'s Sinigang Mix'],
  },
  {
    id: 'r-3',
    title: 'Kare-Kare',
    title_local: 'Oxtail Peanut Stew',
    description: 'Rich and creamy Filipino stew featuring tender oxtail, tripe, eggplant, and banana blossom in rich savory peanut sauce served with bagoong alamang.',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&fit=crop',
    cuisine_type: 'Fiesta',
    difficulty: 'medium',
    difficulty_local: 'Katamtaman',
    prep_time: 30,
    cook_time: 120,
    total_time: 150,
    servings: 8,
    cost_estimate_min: 450,
    cost_estimate_max: 600,
    calories_per_serving: 540,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Fiesta'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.85,
    rating_count: 95,
    save_count: 280,
    mama_sita_products: ['Mama Sita\'s Kare-Kare Mix', 'Mama Sita\'s Bagoong'],
  },
  {
    id: 'r-4',
    title: 'Bulalo Batangas',
    title_local: 'Beef Shank & Marrow Soup',
    description: 'Hearty Filipino beef soup made by slow-boiling beef shanks and bone marrow with corn on the cob, cabbage, and peppercorns.',
    image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&q=80&fit=crop',
    cuisine_type: 'Filipino',
    difficulty: 'medium',
    difficulty_local: 'Katamtaman',
    prep_time: 20,
    cook_time: 150,
    total_time: 170,
    servings: 6,
    cost_estimate_min: 400,
    cost_estimate_max: 550,
    calories_per_serving: 490,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Soup', 'High-Protein'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.8,
    rating_count: 76,
    save_count: 210,
    mama_sita_products: null,
  },
  {
    id: 'r-5',
    title: 'Lumpia Shanghai',
    title_local: 'Crispy Pork Spring Rolls',
    description: 'Golden, crispy Filipino fried spring rolls packed with seasoned ground pork, minced carrots, onions, and garlic served with sweet and sour sauce.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&fit=crop',
    cuisine_type: 'Merienda',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 25,
    cook_time: 20,
    total_time: 45,
    servings: 10,
    cost_estimate_min: 180,
    cost_estimate_max: 240,
    calories_per_serving: 260,
    meal_type: ['merienda', 'hapunan'],
    dietary_tags: ['Snack', 'Party Favorite'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.9,
    rating_count: 210,
    save_count: 520,
    mama_sita_products: ['Mama Sita\'s Sweet & Sour Sauce'],
  },
  {
    id: 'r-6',
    title: 'Lechon Kawali',
    title_local: 'Crispy Deep-Fried Pork Belly',
    description: 'Juicy pork belly boiled in aromatics then deep-fried to crisp perfection with crackling skin, served with liver sauce.',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80&fit=crop',
    cuisine_type: 'Fiesta',
    difficulty: 'medium',
    difficulty_local: 'Katamtaman',
    prep_time: 15,
    cook_time: 60,
    total_time: 75,
    servings: 6,
    cost_estimate_min: 350,
    cost_estimate_max: 450,
    calories_per_serving: 580,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Crispy', 'Fiesta'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.88,
    rating_count: 110,
    save_count: 295,
    mama_sita_products: null,
  },
  {
    id: 'r-7',
    title: 'Bicol Express',
    title_local: 'Spicy Pork in Coconut Milk',
    description: 'Fiery Bicolano dish featuring tender pork strips simmered in rich coconut cream, shrimp paste (bagoong), and plenty of green chili peppers.',
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80&fit=crop',
    cuisine_type: 'Ulam',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 15,
    cook_time: 35,
    total_time: 50,
    servings: 4,
    cost_estimate_min: 220,
    cost_estimate_max: 290,
    calories_per_serving: 460,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Spicy', 'Coconut'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.82,
    rating_count: 88,
    save_count: 240,
    mama_sita_products: ['Mama Sita\'s Bagoong'],
  },
  {
    id: 'r-8',
    title: 'Pinakbet Tagalog',
    title_local: 'Vegetable Stew with Bagoong',
    description: 'Nutritious Filipino vegetable dish loaded with squash, okra, eggplant, sitaw, ampalaya, and pork belly seasoned with shrimp paste.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&fit=crop',
    cuisine_type: 'Ulam',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 20,
    cook_time: 25,
    total_time: 45,
    servings: 5,
    cost_estimate_min: 160,
    cost_estimate_max: 220,
    calories_per_serving: 230,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Vegetables', 'Healthy'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.75,
    rating_count: 65,
    save_count: 180,
    mama_sita_products: ['Mama Sita\'s Bagoong Alamang'],
  },
  {
    id: 'r-9',
    title: 'Pancit Canton Special',
    title_local: 'Stir-Fried Filipino Noodles',
    description: 'Savory stir-fried egg noodles tossed with chicken breast, shrimp, cabbage, carrots, bell peppers, and calamansi juice.',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&fit=crop',
    cuisine_type: 'Merienda',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 20,
    cook_time: 15,
    total_time: 35,
    servings: 6,
    cost_estimate_min: 200,
    cost_estimate_max: 270,
    calories_per_serving: 350,
    meal_type: ['merienda', 'hapunan'],
    dietary_tags: ['Noodles', 'Noche Buena'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.87,
    rating_count: 135,
    save_count: 360,
    mama_sita_products: ['Mama Sita\'s Oyster Sauce'],
  },
  {
    id: 'r-10',
    title: 'Bistek Tagalog',
    title_local: 'Filipino Beef Steak',
    description: 'Thinly sliced beef sirloin marinated in soy sauce and calamansi juice, pan-fried and topped with sweet caramelized onion rings.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&fit=crop',
    cuisine_type: 'Ulam',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 20,
    cook_time: 25,
    total_time: 45,
    servings: 4,
    cost_estimate_min: 290,
    cost_estimate_max: 380,
    calories_per_serving: 390,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['High-Protein'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.86,
    rating_count: 94,
    save_count: 270,
    mama_sita_products: ['Mama Sita\'s Soy Sauce'],
  },
  {
    id: 'r-11',
    title: 'Tinolang Manok',
    title_local: 'Chicken Ginger Soup with Sayote',
    description: 'Nourishing Filipino chicken soup seasoned with ginger, garlic, sayote (chayote), and fresh chili leaves or malunggay.',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80&fit=crop',
    cuisine_type: 'Ulam',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 15,
    cook_time: 35,
    total_time: 50,
    servings: 5,
    cost_estimate_min: 190,
    cost_estimate_max: 250,
    calories_per_serving: 290,
    meal_type: ['tanghalian', 'hapunan'],
    dietary_tags: ['Soup', 'Healthy'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.8,
    rating_count: 82,
    save_count: 215,
    mama_sita_products: null,
  },
  {
    id: 'r-12',
    title: 'Arroz Caldo',
    title_local: 'Filipino Chicken Rice Porridge',
    description: 'Warm and fragrant ginger chicken congee topped with toasted garlic, spring onions, boiled egg, and fresh calamansi.',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&fit=crop',
    cuisine_type: 'Almusal',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 15,
    cook_time: 40,
    total_time: 55,
    servings: 4,
    cost_estimate_min: 150,
    cost_estimate_max: 200,
    calories_per_serving: 310,
    meal_type: ['almusal', 'merienda'],
    dietary_tags: ['Comfort Food'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.85,
    rating_count: 104,
    save_count: 290,
    mama_sita_products: null,
  },
  {
    id: 'r-13',
    title: 'Tapsilog Special',
    title_local: 'Tapa, Sinangag, at Itlog',
    description: 'Ultimate Filipino breakfast plate featuring marinated garlic beef tapa, fried garlic rice (sinigang), and a sunny-side-up egg.',
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80&fit=crop',
    cuisine_type: 'Almusal',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 15,
    cook_time: 15,
    total_time: 30,
    servings: 2,
    cost_estimate_min: 160,
    cost_estimate_max: 220,
    calories_per_serving: 520,
    meal_type: ['almusal'],
    dietary_tags: ['Breakfast', 'Silog'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.92,
    rating_count: 175,
    save_count: 480,
    mama_sita_products: null,
  },
  {
    id: 'r-14',
    title: 'Halo-Halo Special',
    title_local: 'Filipino Shaved Ice Dessert',
    description: 'Iconic Filipino dessert layered with shaved ice, evaporated milk, sweetened beans, saba bananas, nata de coco, ube halaya, and leche flan.',
    image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80&fit=crop',
    cuisine_type: 'Dessert',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 20,
    cook_time: 0,
    total_time: 20,
    servings: 4,
    cost_estimate_min: 180,
    cost_estimate_max: 250,
    calories_per_serving: 360,
    meal_type: ['merienda'],
    dietary_tags: ['Dessert', 'Summer Favorite'],
    is_ai_generated: false,
    is_featured: true,
    rating_avg: 4.96,
    rating_count: 230,
    save_count: 610,
    mama_sita_products: null,
  },
  {
    id: 'r-15',
    title: 'Champorado with Tuyo',
    title_local: 'Chocolate Rice Porridge with Crispy Fish',
    description: 'Rich chocolate rice porridge made with glutinous rice and real tablea cocoa, drizzled with condensed milk and served with crispy salty tuyo.',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80&fit=crop',
    cuisine_type: 'Dessert',
    difficulty: 'easy',
    difficulty_local: 'Madali',
    prep_time: 10,
    cook_time: 30,
    total_time: 40,
    servings: 4,
    cost_estimate_min: 130,
    cost_estimate_max: 180,
    calories_per_serving: 340,
    meal_type: ['almusal', 'merienda'],
    dietary_tags: ['Chocolate', 'Rainy Day Favorite'],
    is_ai_generated: false,
    is_featured: false,
    rating_avg: 4.88,
    rating_count: 115,
    save_count: 310,
    mama_sita_products: null,
  },
];

export function useRecipes(filters?: { cuisine_type?: string; meal_type?: string; search?: string }) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      let q = supabase
        .from('recipes')
        .select('id,title,title_local,description,image_url,cuisine_type,difficulty,difficulty_local,prep_time,cook_time,total_time,servings,cost_estimate_min,cost_estimate_max,calories_per_serving,meal_type,dietary_tags,is_ai_generated,is_featured,rating_avg,rating_count,save_count,mama_sita_products')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('rating_avg', { ascending: false })
        .limit(60);

      if (filters?.cuisine_type) q = q.eq('cuisine_type', filters.cuisine_type);
      if (filters?.search) q = q.ilike('title', `%${filters.search}%`);

      const { data, error } = await q;

      if (error || !data || data.length === 0) {
        let fallback = [...SEED_FILIPINO_RECIPES];
        if (filters?.cuisine_type) {
          fallback = fallback.filter(r => r.cuisine_type === filters.cuisine_type || r.meal_type.includes(filters.cuisine_type!.toLowerCase()));
        }
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          fallback = fallback.filter(r => r.title.toLowerCase().includes(s) || (r.title_local && r.title_local.toLowerCase().includes(s)));
        }
        return fallback;
      }

      return data as Recipe[];
    },
  });
}

export function useSavedRecipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-recipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe_id, recipes(id,title,title_local,image_url,difficulty,total_time,cost_estimate_min,cost_estimate_max,rating_avg)')
        .eq('user_id', user!.id);
      if (error) return [];
      return data;
    },
    enabled: !!user?.id,
  });
}
