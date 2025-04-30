
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ShareRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('ShareRedirect: Processing shared link with ID:', id);
    
    // Validate the ID parameter
    if (!id) {
      console.error('ShareRedirect: Missing item ID, redirecting to 404');
      navigate('/404', { replace: true });
      return;
    }
    
    // Normalized ID (ensure it's a valid format)
    const normalizedId = id.trim();
    
    if (!normalizedId) {
      console.error('ShareRedirect: Invalid item ID format, redirecting to 404');
      navigate('/404', { replace: true });
      return;
    }
    
    console.log(`ShareRedirect: Redirecting to item page with ID: ${normalizedId}`);
    
    // Use replace to avoid adding to navigation history
    navigate(`/item/${normalizedId}`, { 
      replace: true,
      state: { fromShare: true }
    });
  }, [id, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-gray-600">Redirecting to item...</p>
    </div>
  );
}
