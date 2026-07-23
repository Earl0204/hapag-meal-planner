import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface MarketPrice {
  id: string;
  commodity_name: string;
  commodity_key: string;
  category: string;
  price_min: number;
  price_max: number;
  price_avg: number;
  unit: string;
  market_type: string;
  source: string;
  price_date: string;
  region: string | null;
}

export function usePrices(category?: string) {
  return useQuery({
    queryKey: ['prices', category],
    queryFn: async () => {
      const params = category ? `?category=${category}` : '';
      const { data } = await axios.get(`${API}/api/prices/latest${params}`);
      return data as { prices: MarketPrice[]; updated_at: string };
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}
