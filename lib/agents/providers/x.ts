import { SearchProvider, RawDoc } from './types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export const xSearch: SearchProvider = {
  id: 'x',
  label: 'X (Twitter)',
  keyless: false,
  complianceNote: 'X API via xurl CLI - requires auth setup',
  maxLenses: 6, // Full fan-out, X API is fast
  
  async search(
    query: string,
    opts: { city: string; country: string; timespanMonths: number }
  ): Promise<RawDoc[]> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'agents', 'x_search.py');
    
    try {
      const { stdout } = await execFileAsync(
        'python3',
        [scriptPath, query],
        {
          timeout: 60000
        }
      );
      
      const results = JSON.parse(stdout);
      
      return results.map((doc: any) => ({
        title: doc.title,
        url: doc.url,
        source: 'x_twitter',
        snippet: doc.snippet,
        query,
        city: opts.city,
        country: opts.country,
        publishedAt: doc.created_at || new Date().toISOString()
      }));
      
    } catch (error: any) {
      console.error(`[X Search] Error for "${query}":`, error.message);
      return [];
    }
  }
};
