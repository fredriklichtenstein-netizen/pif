
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ShareRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [itemExists, setItemExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('ShareRedirect: Processing shared link with ID:', id);
    
    // Validate the ID parameter
    if (!id) {
      console.error('ShareRedirect: Missing item ID, redirecting to 404');
      setError('Missing item ID');
      setIsValidating(false);
      setItemExists(false);
      return;
    }
    
    // Normalized ID (ensure it's a valid format)
    const normalizedId = id.trim();
    
    if (!normalizedId) {
      console.error('ShareRedirect: Invalid item ID format, redirecting to 404');
      setError('Invalid item ID format');
      setIsValidating(false);
      setItemExists(false);
      return;
    }

    // Check if the item exists in the database before redirecting
    const validateItem = async () => {
      try {
        // Convert the ID to a number since the database expects a numeric ID
        const numericId = parseInt(normalizedId, 10);
        
        if (isNaN(numericId)) {
          console.error('ShareRedirect: Item ID is not a number:', normalizedId);
          setError('Invalid item ID format - not a number');
          setItemExists(false);
          setIsValidating(false);
          return;
        }
        
        console.log(`ShareRedirect: Validating if item ${numericId} exists`);
        
        const { data, error } = await supabase
          .from('items')
          .select('id')
          .eq('id', numericId)
          .single();
          
        if (error) {
          console.error('ShareRedirect: Error checking item existence:', error);
          setError(`Database error: ${error.message}`);
          setItemExists(false);
        } else if (!data) {
          console.error(`ShareRedirect: Item with ID ${numericId} not found`);
          setError('Item not found');
          setItemExists(false);
        } else {
          console.log(`ShareRedirect: Item ${numericId} exists, redirecting`);
          setItemExists(true);
          
          // Add a short delay before redirecting to ensure state is properly passed
          setTimeout(() => {
            navigate(`/item/${numericId}`, { 
              replace: true,
              state: { 
                fromShare: true,
                timestamp: Date.now() 
              }
            });
          }, 100);
        }
      } catch (err) {
        console.error('ShareRedirect: Unexpected error during validation:', err);
        setError('Unexpected error during validation');
        setItemExists(false);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateItem();
  }, [id, navigate, toast]);
  
  // If validation is complete and item doesn't exist, redirect to 404
  useEffect(() => {
    if (!isValidating && itemExists === false) {
      toast({
        title: "Item not found",
        description: `The shared item couldn't be found: ${error}`,
        variant: "destructive",
      });
      
      // Redirect to 404 with context
      navigate('/404', { 
        replace: true, 
        state: { 
          from: 'share',
          itemId: id,
          error: error
        } 
      });
    }
  }, [isValidating, itemExists, id, navigate, error, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isValidating ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Validating item...</p>
        </>
      ) : itemExists === false ? (
        <>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-gray-600">Item not found. Redirecting...</p>
        </>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Redirecting to item...</p>
        </>
      )}
    </div>
  );
}
