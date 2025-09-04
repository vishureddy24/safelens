import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Newspaper, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  Eye, 
  Zap, 
  RefreshCw, 
  EyeOff, 
  ShieldCheck, 
  X 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";

type Classification = 'REAL' | 'FAKE' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'PENDING';

interface VerificationSource {
  name: string;
  url: string;
  isTrusted: boolean;
}

interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | null;
  confidence: number;
  reasons: string[];
  sources: VerificationSource[];
}

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  classification: Classification;
  reasons: string[];
  publishedAt: string;
  url?: string;
  imageUrl?: string;
  content?: string;
  author?: string;
  similarityScore?: number;
  similarTo?: string[];
  date?: string;
  error?: string;
}

export const NewsScanner = () => {
  // News verification state
  const [verificationText, setVerificationText] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult>({
    status: null,
    confidence: 0,
    reasons: [],
    sources: []
  });
  
  // News scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [analyzedNews, setAnalyzedNews] = useState<NewsItem[]>([]);
  const [pastedNews, setPastedNews] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [category, setCategory] = useState("business");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  
  // News articles state
  const [newsArticles, setNewsArticles] = useState<Array<{
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    publishedAt: string;
    source: { name: string };
  }>>([]);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Misc state
  const [retryCount, setRetryCount] = useState(0);
  const newsCache = useRef<{data: NewsItem[], timestamp: number} | null>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // If date is today, show time, otherwise show date
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      return isToday 
        ? `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle manual news verification
  const handleVerifyNews = async (newsItem: NewsItem) => {
    try {
      // Update the news item to show it's being verified
      setAnalyzedNews(prev => 
        prev.map(item => 
          item.id === newsItem.id 
            ? { 
                ...item, 
                classification: 'PENDING' as const, 
                reasons: [] 
              }
            : item
        )
      );

      const response = await api.post('/api/news-verification', {
        headline: newsItem.headline,
        content: newsItem.content || '',
        source: newsItem.source,
        url: newsItem.url || ''
      });

      const result = response.data;
      if (!result) {
        throw new Error('Invalid response format from verification service');
      }
      
      // Determine the final classification
      let finalClassification: Classification = 'UNVERIFIED';
      if (result.status) {
        const status = String(result.status).toUpperCase();
        if (['REAL', 'FAKE', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'PENDING'].includes(status)) {
          finalClassification = status as Classification;
        }
      }
      
      // If any trusted source is found, mark as verified
      if (result.sources?.some((source: any) => source.isTrusted)) {
        finalClassification = 'REAL';
      }
      
      // Update the news item with verification results
      setAnalyzedNews(prev => prev.map(item => 
        item.id === newsItem.id 
          ? { 
              ...item, 
              classification: finalClassification,
              reasons: result.reasons || [],
              similarityScore: result.similarityScore,
              similarTo: result.similarTo || []
            }
          : item
      ));
    } catch (error) {
      console.error('Error verifying news:', error);
      setAnalyzedNews(prev => prev.map(item => 
        item.id === newsItem.id 
          ? { 
              ...item, 
              classification: 'UNVERIFIED',
              error: 'Failed to verify: ' + (error instanceof Error ? error.message : 'Unknown error')
            }
          : item
      ));
    }
  };

  // Handle verification of custom text
  const handleVerifyCustomText = async () => {
    if (!verificationText.trim()) return;
    
    setIsVerifying(true);
    setVerificationResult({
      status: null,
      confidence: 0,
      reasons: [],
      sources: []
    });
    
    try {
      const response = await api.post('/api/news-verification', {
        headline: verificationText,
        content: ''
      });

      const result = response.data;
      if (!result) {
        throw new Error('No data received from verification service');
      }
      
      // If any trusted source is found, mark as verified
      const status = result.sources?.some((source: any) => source.isTrusted) 
        ? 'verified' 
        : result.status || 'unverified';
      
      setVerificationResult({
        status: status as 'verified' | 'partially_verified' | 'unverified' | null,
        confidence: result.confidence || 0,
        reasons: result.reasons || [],
        sources: result.sources || []
      });
    } catch (error) {
      console.error('Error verifying news:', error);
      setVerificationResult({
        status: 'unverified',
        confidence: 0,
        reasons: ['Failed to verify: ' + (error instanceof Error ? error.message : 'Unknown error')],
        sources: []
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Clear verification result
  const clearVerification = () => {
    setVerificationText('');
    setVerificationResult({
      status: null,
      confidence: 0,
      reasons: [],
      sources: []
    });
  };

  // Get badge variant based on classification
  const getBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'REAL':
        return 'default';
      case 'FAKE':
        return 'destructive';
      case 'PARTIALLY_VERIFIED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Filter news based on search query and risk filter
  const filteredNews = analyzedNews.filter(item => {
    const matchesSearch = item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || item.classification === riskFilter.toUpperCase();
    return matchesSearch && matchesRisk;
  });

  // List of trusted news sources (can be expanded as needed)
  const TRUSTED_SOURCES = [
    'reuters.com',
    'apnews.com',
    'bbc.com',
    'npr.org',
    'nytimes.com',
    'washingtonpost.com',
    'wsj.com',
    'bloomberg.com',
    'theguardian.com',
    'ap.org',
    'aljazeera.com',
    'nbcnews.com',
    'cnn.com',
    'reuters.com',
    'apnews.com'
  ];

  // Check if a URL is from a trusted source
  const isTrustedSource = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return TRUSTED_SOURCES.some(trusted => domain.endsWith(trusted));
    } catch (e) {
      return false;
    }
  };

  // Fetch news articles from API
  const fetchNewsArticles = useCallback(async () => {
    setIsLoadingNews(true);
    setError(null);
    
    try {
      // First, fetch regular news
      const response = await fetch('/api/news?pageSize=20'); // Fetch more to account for filtering
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter for trusted sources and verify each article
        const verifiedArticles = await Promise.all(
          data.data
            .filter((article: any) => article.url && isTrustedSource(article.url))
            .map(async (article: any) => {
              try {
                const verifyResponse = await fetch('/api/news/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    headline: article.title,
                    content: article.description || ''
                  })
                });
                
                if (verifyResponse.ok) {
                  const verification = await verifyResponse.json();
                  return {
                    ...article,
                    verification: verification.data
                  };
                }
              } catch (e) {
                console.error('Error verifying article:', e);
                return null;
              }
              return null;
            })
        );

        // Filter for only verified and partially verified articles
        const filteredArticles = verifiedArticles
          .filter(Boolean)
          .filter((article: any) => 
            article.verification && 
            (article.verification.status === 'verified' || 
             article.verification.status === 'partially_verified')
          )
          .slice(0, 10); // Limit to 10 articles

        setNewsArticles(filteredArticles);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Fetch news on component mount
  useEffect(() => {
    fetchNewsArticles();
  }, [fetchNewsArticles]);

  // Handle scanning news
  const handleScanNews = () => {
    if (!pastedNews.trim()) return;
    
    setIsScanning(true);
    // Simulate API call
    setTimeout(() => {
      const newItem: NewsItem = {
        id: `scanned-${Date.now()}`,
        headline: 'Scanned News Article',
        source: 'User Input',
        classification: 'UNVERIFIED',
        reasons: ['Manually submitted for verification'],
        publishedAt: new Date().toISOString(),
        content: pastedNews
      };
      setAnalyzedNews(prev => [newItem, ...prev]);
      setPastedNews('');
      setIsScanning(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Latest News</h2>
      </div>

      <Tabs defaultValue="scanner" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="scanner"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md py-2"
          >
            <Newspaper className="h-4 w-4 mr-2" />
            News Scanner
          </TabsTrigger>
          <TabsTrigger 
            value="verifier"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md py-2"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify News
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="verifier" className="mt-6 animate-fade-in">
          <Card className="border-2 border-blue-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-blue-700 text-sm">
                  Paste any news headline or article below to check its authenticity and reliability
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">News Content to Verify</label>
                  <Textarea
                    placeholder="Paste news headline or article text here..."
                    className="min-h-[150px] text-base border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                    value={verificationText}
                    onChange={(e) => setVerificationText(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Tip: For best results, include the headline and first few paragraphs of the article
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  {verificationResult && (
                    <Button 
                      variant="outline" 
                      onClick={clearVerification}
                      disabled={isVerifying}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Clear
                    </Button>
                  )}
                  <Button 
                    onClick={handleVerifyCustomText} 
                    disabled={!verificationText.trim() || isVerifying}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>

                {verificationResult && (
                  <div className="mt-6 space-y-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                      Verification Results
                    </div>
                    <Alert 
                      className={
                        verificationResult.status === 'verified' 
                          ? 'bg-green-50 border-green-200' 
                          : verificationResult.status === 'partially_verified' 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-red-50 border-red-200'
                      }
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {verificationResult.status === 'verified' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : verificationResult.status === 'partially_verified' ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-base font-semibold text-gray-900">
                            {verificationResult.status === 'verified' 
                              ? '✅ Verified News' 
                              : verificationResult.status === 'partially_verified' 
                                ? '⚠️ Partially Verified' 
                                : '❌ Unverified Content'}
                          </h3>
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-gray-800">Confidence: {verificationResult.confidence.toFixed(1)}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  verificationResult.status === 'verified' 
                                    ? 'bg-green-500' 
                                    : verificationResult.status === 'partially_verified' 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${verificationResult.confidence}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Alert>

                    {verificationResult.reasons && verificationResult.reasons.length > 0 && (
                      <div className="border-t border-gray-200 pt-8">
                        <h4 className="font-semibold text-gray-900">Analysis:</h4>
                        <ul className="space-y-2 pl-4">
                          {verificationResult.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-800">
                              <span className="text-gray-500 mt-1">•</span>
                              <span className="text-gray-700">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {verificationResult.sources && verificationResult.sources.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <h4 className="font-semibold text-gray-900">Sources:</h4>
                        <div className="space-y-2 pl-1">
                          {verificationResult.sources.slice(0, 3).map((source, i) => (
                            <a 
                              key={i} 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              {source.isTrusted && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {source.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scanner" className="mt-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">Scan News Article</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchNewsArticles}
                disabled={isLoadingNews}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-800 font-medium"
              >
                {isLoadingNews ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Refresh News</span>
              </Button>
            </div>
            {newsArticles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Newspaper className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Articles Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">We couldn't find any verified news articles at the moment. Please try again later.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchNewsArticles}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {newsArticles.map((item, i) => {
                  const isTrustedSource = item.url ? isTrustedSource(item.url) : false;
                  // If source is trusted, consider it as VERIFIED regardless of original classification
                  const effectiveClassification = isTrustedSource ? 'VERIFIED' : (item.classification || 'UNVERIFIED');
                  const isPending = effectiveClassification === 'PENDING';
                  const isVerified = effectiveClassification === 'VERIFIED' || effectiveClassification === 'PARTIALLY_VERIFIED';
                  
                  return (
                    <Card key={i} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 border-b border-gray-200">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {item.url ? (
                                <a 
                                  href={item.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-blue-600"
                                >
                                  {item.headline || 'Untitled Article'}
                                </a>
                              ) : (
                                <span className="text-gray-900">{item.headline || 'Untitled Article'}</span>
                              )}
                            </CardTitle>
                            <Badge 
                              variant={getBadgeVariant(effectiveClassification)}
                              className="ml-2 whitespace-nowrap"
                            >
                              {effectiveClassification.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">{item.source?.name || 'Unknown Source'}</span>
                            <span>•</span>
                            <span>{formatDate(item.publishedAt)}</span>
                            {isVerified && (
                              <span className="ml-2 text-green-600 flex items-center">
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                {isTrustedSource ? (
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:underline hover:text-green-700"
                                  >
                                    Verified Source
                                  </a>
                                ) : 'Verified'}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-4">
                        <div className="text-sm text-gray-700 mb-4">
                          {item.content || 'No content available'}
                        </div>
                        
                        {!isVerified && !isPending && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-600">
                                This content hasn't been verified yet
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleVerifyNews(item)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Verify Now
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {isPending && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-center py-2">
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                              <span className="text-sm text-gray-600">Verifying content...</span>
                            </div>
                          </div>
                        )}
                        
                        {item.reasons && item.reasons.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Verification Details:</h4>
                            <ul className="space-y-1.5">
                              {item.reasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {item.error && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                            <div className="flex items-center text-red-700 text-sm">
                              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Error: {item.error}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
