
// Query batching utilities for improved performance
export class QueryBatcher {
  private static readonly BATCH_SIZE = 10;
  private static readonly BATCH_DELAY = 50; // milliseconds
  
  private static pendingBatches = new Map<string, {
    queries: Array<{
      resolve: (result: any) => void;
      reject: (error: any) => void;
      params: any;
    }>;
    timer: NodeJS.Timeout;
  }>();

  // Batch similar queries together
  static async batchQuery<T>(
    batchKey: string,
    queryFn: (params: any[]) => Promise<T[]>,
    params: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batch = this.pendingBatches.get(batchKey) || {
        queries: [],
        timer: setTimeout(() => this.executeBatch(batchKey, queryFn), this.BATCH_DELAY)
      };

      batch.queries.push({ resolve, reject, params });
      
      if (batch.queries.length >= this.BATCH_SIZE) {
        clearTimeout(batch.timer);
        this.executeBatch(batchKey, queryFn);
      } else {
        this.pendingBatches.set(batchKey, batch);
      }
    });
  }

  private static async executeBatch<T>(
    batchKey: string,
    queryFn: (params: any[]) => Promise<T[]>
  ) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch) return;

    this.pendingBatches.delete(batchKey);
    
    try {
      const allParams = batch.queries.map(q => q.params);
      const results = await queryFn(allParams);
      
      batch.queries.forEach((query, index) => {
        query.resolve(results[index]);
      });
    } catch (error) {
      batch.queries.forEach(query => {
        query.reject(error);
      });
    }
  }
}

// Utility function for batching queries
export const batchQueries = QueryBatcher.batchQuery.bind(QueryBatcher);
