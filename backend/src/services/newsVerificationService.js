import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const NEWS_API_KEY = process.env.NEWS_API_KEY;

class NewsVerificationService {
    constructor() {
        this.trustedSources = [
            'reuters.com', 'apnews.com', 'bloomberg.com', 'cnbc.com', 
            'wsj.com', 'ft.com', 'forbes.com', 'nytimes.com',
            'theguardian.com', 'bbc.co.uk', 'economist.com'
        ];
    }

    async verifyNews(headline, content = '') {
        try {
            if (!headline) {
                throw new Error('Headline is required');
            }
            
            // Step 1: Check News API
            const newsApiResults = await this.checkNewsAPI(headline);
            
            // Step 2: Analyze content
            const analysis = this.analyzeContent(content || headline);
            
            // Step 3: Determine verification status
            const verification = this.determineVerificationStatus(newsApiResults, analysis);
            
            return {
                status: verification.status,
                confidence: verification.confidence,
                sources: newsApiResults.sources || [],
                reasons: verification.reasons || []
            };
        } catch (error) {
            console.error('Error in news verification:', error);
            return {
                status: 'unverified',
                confidence: 0,
                sources: [],
                reasons: [error.message || 'Error during verification']
            };
        }
    }

    async checkNewsAPI(query) {
        try {
            if (!NEWS_API_KEY) {
                throw new Error('NewsAPI key is not configured');
            }

            // Clean the query to improve search results
            const cleanQuery = query.replace(/[^\w\s]/gi, '').trim();
            
            // First, try an exact match search
            const exactMatchResponse = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: `"${cleanQuery}"`, // Exact phrase match
                    apiKey: NEWS_API_KEY,
                    pageSize: 5,
                    sortBy: 'relevancy',
                    language: 'en',
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
                }
            });

            // If no exact matches, try a broader search
            let response = exactMatchResponse;
            if (exactMatchResponse.data.totalResults === 0) {
                response = await axios.get('https://newsapi.org/v2/everything', {
                    params: {
                        q: cleanQuery,
                        apiKey: NEWS_API_KEY,
                        pageSize: 10, // Get more results for broader search
                        sortBy: 'relevancy',
                        language: 'en',
                        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }
                });
            }

            const sources = [];
            const seenUrls = new Set();
            let trustedSourceCount = 0;

            // Process articles, removing duplicates and checking trustworthiness
            response.data.articles.forEach(article => {
                if (!article.url || seenUrls.has(article.url)) return;
                
                const urlObj = new URL(article.url);
                const domain = urlObj.hostname.replace('www.', '');
                const isTrusted = this.trustedSources.includes(domain);
                
                const source = {
                    name: article.source?.name || domain,
                    url: article.url,
                    publishedAt: article.publishedAt,
                    isTrusted,
                    title: article.title,
                    description: article.description
                };

                if (isTrusted) trustedSourceCount++;
                sources.push(source);
                seenUrls.add(article.url);
            });

            return {
                totalResults: response.data.totalResults || 0,
                trustedSourceCount,
                sources: sources.slice(0, 8) // Limit to top 8 unique sources
            };
        } catch (error) {
            console.error('News API error:', error.message);
            return {
                totalResults: 0,
                trustedSourceCount: 0,
                sources: [],
                error: 'Failed to fetch from News API'
            };
        }
    }

    analyzeContent(headline) {
        const clickbaitPhrases = [
            // Emotional manipulation
            'shocking', 'mind-blowing', 'unbelievable', 'incredible', 'jaw-dropping',
            // Urgency/Scarcity
            'act now', 'limited time', 'today only', 'before it\'s too late', 'don\'t miss out',
            // Sensationalism
            'destroy', 'annihilate', 'obliterate', 'you won\'t believe', 'will shock you',
            // Promises/Guarantees
            'guaranteed', '100%', 'free money', 'secret', 'exclusive', 'proven',
            // Questionable claims
            'miracle', 'magic', 'instant', 'overnight', 'hack', 'trick', 'secret',
            // Authority manipulation
            'doctors hate this', 'experts agree', 'scientists say', 'they don\'t want you to know'
        ];

        const reasons = [];
        let score = 100; // Start with perfect score
        const headlineLower = headline.toLowerCase();

        // Check for clickbait phrases
        const foundClickbait = clickbaitPhrases.filter(phrase => 
            headlineLower.includes(phrase)
        );

        if (foundClickbait.length > 0) {
            const points = Math.min(40, foundClickbait.length * 8); // Cap at 40 points deduction
            score -= points;
            reasons.push(`Found ${foundClickbait.length} clickbait phrase${foundClickbait.length > 1 ? 's' : ''}`);
            
            // Add specific clickbait examples (up to 3)
            const examples = foundClickbait.slice(0, 3).map(p => `"${p}"`).join(', ');
            if (foundClickbait.length > 3) {
                reasons.push(`Including: ${examples}, and ${foundClickbait.length - 3} more`);
            } else {
                reasons.push(`Including: ${examples}`);
            }
        }

        // Check headline characteristics
        const headlineLength = headline.length;
        if (headlineLength > 120) {
            const deduction = Math.min(20, Math.floor((headlineLength - 100) / 5));
            score -= deduction;
            reasons.push(`Headline is very long (${headlineLength} characters)`);
        } else if (headlineLength < 20) {
            score -= 10;
            reasons.push('Headline is unusually short');
        }

        // Check for excessive punctuation
        const exclamationCount = (headline.match(/!/g) || []).length;
        const questionCount = (headline.match(/\?/g) || []).length;
        
        if (exclamationCount > 1 || questionCount > 1) {
            const totalPunctuation = exclamationCount + questionCount;
            const deduction = Math.min(20, (totalPunctuation - 1) * 5);
            score -= deduction;
            reasons.push(`Excessive punctuation (${'!'.repeat(exclamationCount)}${'?'.repeat(questionCount)}) may indicate sensationalism`);
        }

        // Check for all caps words
        const allCapsWords = headline.split(/\s+/).filter(word => 
            word.length > 2 && word === word.toUpperCase()
        );
        
        if (allCapsWords.length > 0) {
            score -= allCapsWords.length * 3;
            reasons.push(`Uses all-caps: ${allCapsWords.slice(0, 3).join(', ')}`);
        }

        // Check for numbers (can indicate listicles or sensationalism)
        const numberCount = (headline.match(/\d+/g) || []).length;
        if (numberCount > 0) {
            // Only penalize if it's not a year or reasonable number
            const containsYear = /(19|20)\d{2}/.test(headline);
            if (!containsYear) {
                score -= 5 * numberCount;
                reasons.push(`Contains ${numberCount} number${numberCount > 1 ? 's' : ''} (may indicate listicle)`);
            }
        }

        return {
            score: Math.max(0, Math.min(100, score)), // Keep score between 0-100
            reasons
        };
    }

    determineVerificationStatus(newsApiResults, analysis) {
        const { totalResults, trustedSourceCount, sources } = newsApiResults;
        const { score, reasons } = analysis;
        
        // Base confidence on multiple factors
        const sourceFactor = Math.min(100, trustedSourceCount * 30); // Up to 3 trusted sources (90%)
        const contentFactor = score; // Content analysis score (0-100)
        const resultsFactor = Math.min(100, totalResults * 5); // More results = higher confidence
        
        // Calculate weighted confidence
        const confidence = Math.round(
            (sourceFactor * 0.4) + 
            (contentFactor * 0.3) + 
            (resultsFactor * 0.3)
        );
        
        // Determine status based on multiple factors
        let status = 'unverified';
        
        // If we have at least one trusted source and good content score
        if (trustedSourceCount >= 1 && contentFactor >= 60) {
            if (trustedSourceCount >= 2 || confidence >= 75) {
                status = 'verified';
            } else {
                status = 'partially_verified';
            }
        } 
        // If we have multiple sources but lower content score
        else if (totalResults >= 3 && confidence >= 50) {
            status = 'partially_verified';
            reasons.push('Multiple sources found but content analysis raises some concerns');
        }
        // If we have no results at all
        else if (totalResults === 0) {
            status = 'unverified';
            reasons.push('No matching news found from any sources');
        }
        
        // Add source information to reasons if available
        if (sources.length > 0) {
            const trustedSources = sources.filter(s => s.isTrusted);
            if (trustedSources.length > 0) {
                reasons.push(`Found ${trustedSources.length} trusted source${trustedSources.length > 1 ? 's' : ''}`);
            }
        }
        
        // If we have no specific reasons but still unverified, add a generic reason
        if (status === 'unverified' && reasons.length === 0) {
            reasons.push('Insufficient verification from trusted sources');
        }
        
        return {
            status,
            confidence: Math.min(100, Math.max(0, confidence)), // Ensure 0-100 range
            reasons: [...new Set(reasons)] // Remove any duplicate reasons
        };
    }
}

export default new NewsVerificationService();
