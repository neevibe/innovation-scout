import { SearchProvider, RawDoc } from './types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export const googleSearch: SearchProvider = {
  id: 'google',
  label: 'Google Search',
  keyless: false,
  complianceNote: 'Google Custom Search API - 100 queries/day free tier',
  maxLenses: 3, // 6 cities × 3 lenses = 18 queries/refresh
  
  async search(
    query: string,
    opts: { city: string; country: string; timespanMonths: number }
  ): Promise<RawDoc[]> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'agents', 'google_search.py');
    
    try {
      const { stdout } = await execFileAsync(
        'python3',
        [scriptPath, query],
        {
          timeout: 45000,
          env: {
            ...process.env,
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
            GOOGLE_CX: process.env.GOOGLE_CX || ''
          }
        }
      );
      
      const results = JSON.parse(stdout);
      
      return results.map((doc: any) => ({
        title: doc.title,
        url: doc.url,
        source: doc.source,
        snippet: doc.snippet,
        query,
        city: opts.city,
        country: opts.country,
        publishedAt: new Date().toISOString()
      }));
      
    } catch (error: any) {
      console.error(`[Google Search] Error for "${query}":`, error.message);
      return [];
    }
  }
};
