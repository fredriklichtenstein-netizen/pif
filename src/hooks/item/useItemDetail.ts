
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useItemDetail(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Item not found');

      return data;
    },
    retry: 1
  });
}
