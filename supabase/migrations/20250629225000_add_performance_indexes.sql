
-- Add performance-critical indexes for better query performance

-- Index for items queries (most common filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_created_user_archived 
ON items (created_at DESC, user_id, archived_at) 
WHERE archived_at IS NULL;

-- Index for items by location queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_coordinates_active 
ON items USING GIST (coordinates) 
WHERE archived_at IS NULL;

-- Index for items by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_category_active 
ON items (category, created_at DESC) 
WHERE archived_at IS NULL;

-- Composite index for user's items queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_user_status_created 
ON items (user_id, archived_at, created_at DESC);

-- Index for likes aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_item_created 
ON likes (item_id, created_at DESC);

-- Index for interests aggregation  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interests_item_created 
ON interests (item_id, created_at DESC);

-- Index for comments aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_item_created 
ON comments (item_id, created_at DESC);

-- Index for user profile lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username_lower 
ON profiles (LOWER(username));

-- Index for conversation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_updated_item 
ON conversations (updated_at DESC, item_id);

-- Index for message queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created 
ON messages (conversation_id, created_at DESC);

-- Index for notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created_read 
ON notifications (user_id, created_at DESC, is_read);
