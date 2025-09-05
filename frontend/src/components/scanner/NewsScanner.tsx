import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Newspaper, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Clock,
  Calendar,
  User,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Minus,
  BarChart2,
  TrendingUp,
  AlertOctagon,
  HelpCircle,
  Info,
  Globe,
  Hash,
  Link2,
  Bookmark,
  Share2,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";
import { api } from "@/lib/api";
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

type Classification = 'REAL' | 'FAKE' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'PENDING';

interface VerificationSource {
  name: string;
  url: string;
  isTrusted: boolean;
}

interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified' | null;
  confidence: number;
  sources: VerificationSource[];
  reasons: string[];
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
  verification?: VerificationResult;
}

export const NewsScanner = () => {
  // News verification state
  const [verificationText, setVerificationText] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // News scanning state
  const [analyzedNews, setAnalyzedNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  
  // Check if a source is trusted
  const isTrustedSource = (url: string): boolean => {
    if (!url) return false;
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const TRUSTED_SOURCES = [
        'reuters.com',
        'apnews.com',
        'bbc.com',
        'npr.org',
        'nytimes.com',
        'washingtonpost.com',
        'theguardian.com',
        'wsj.com',
        'bloomberg.com',
        'ap.org'
      ];
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
      // First, fetch regular news using the API client
      const response = await api.get('/api/news?pageSize=20');
      
      if (response.status === 'success' && response.articles) {
        // Filter for trusted sources and verify each article
        const verifiedArticles = await Promise.all(
          response.articles
            .filter((article: any) => article.url && isTrustedSource(article.url))
            .map(async (article: any) => {
              try {
                const verification = await api.post('/api/news-verification', {
                  headline: article.title,
                  content: article.description || ''
                });
                
                return {
                  id: article.url,
                  headline: article.title,
                  source: article.source?.name || 'Unknown',
                  classification: 'PENDING',
                  reasons: [],
                  publishedAt: article.publishedAt,
                  url: article.url,
                  imageUrl: article.urlToImage,
                  content: article.description,
                  author: article.author,
                  verification: verification.data || verification
                } as NewsItem;
              } catch (e) {
                console.error('Error verifying article:', e);
                return null;
              }
            })
        );

        // Filter for only verified and partially verified articles
        const filteredArticles = verifiedArticles
          .filter(Boolean)
          .filter((article: NewsItem | null): article is NewsItem => 
            article !== null && 
            article.verification && 
            (article.verification.status === 'verified' || 
             article.verification.status === 'partially_verified')
          );

        setAnalyzedNews(filteredArticles);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to fetch news. Please try again later.');
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Handle manual news verification
  const handleVerifyNews = async (newsItem: NewsItem) => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const verification = await api.post('/api/news-verification', {
        headline: newsItem.headline,
        content: newsItem.content || ''
      });
      
      setVerificationResult(verification.data || verification);
      
      // Update the news item with verification result
      setAnalyzedNews(prevNews => 
        prevNews.map(item => 
          item.id === newsItem.id 
            ? { ...item, verification: verification.data || verification }
            : item
        )
      );
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError('Failed to verify news. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle verification of custom text
  const handleVerifyCustomText = async () => {
    if (!verificationText.trim()) {
      setVerificationError('Please enter some text to verify');
      return;
    }
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const verification = await api.post('/api/news-verification', {
        headline: verificationText,
        content: ''
      });
      
      setVerificationResult(verification.data || verification);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError('Failed to verify text. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Clear verification result
  const clearVerification = () => {
    setVerificationResult(null);
    setVerificationError(null);
    setVerificationText('');
  };

  // Get badge variant based on classification
  const getBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'REAL':
        return 'default';
      case 'FAKE':
        return 'destructive';
      case 'PARTIALLY_VERIFIED':
        return 'warning';
      case 'UNVERIFIED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Filter news based on search query and risk filter
  const filteredNews = analyzedNews.filter(item => {
    const matchesSearch = item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || 
                       (riskFilter === 'high' && item.classification === 'FAKE') ||
                       (riskFilter === 'medium' && item.classification === 'PARTIALLY_VERIFIED') ||
                       (riskFilter === 'low' && item.classification === 'REAL');
    
    return matchesSearch && matchesRisk;
  });

  // Handle scanning news
  const handleScanNews = () => {
    fetchNewsArticles();
  };

  // Load news on component mount
  useEffect(() => {
    fetchNewsArticles();
  }, [fetchNewsArticles]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">News Scanner</h1>
          <p className="text-muted-foreground">
            Scan and verify news articles for authenticity
          </p>
        </div>
        <Button 
          onClick={handleScanNews}
          disabled={isLoadingNews}
          className="w-full md:w-auto"
        >
          {isLoadingNews ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan for Latest News
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingNews ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredNews.length > 0 ? (
            <div className="space-y-4">
              {filteredNews.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.headline}
                        </a>
                      </CardTitle>
                      <Badge 
                        variant={getBadgeVariant(item.classification)}
                        className="ml-2"
                      >
                        {item.classification.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center text-sm">
                      <span>{item.source}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                      {item.author && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{item.author}</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {item.content || 'No content available.'}
                    </p>
                    
                    {item.verification && (
                      <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {item.verification.status === 'verified' ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : item.verification.status === 'partially_verified' ? (
                            <ShieldAlert className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <ShieldQuestion className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium">
                            {item.verification.status === 'verified' 
                              ? 'Verified' 
                              : item.verification.status === 'partially_verified'
                                ? 'Partially Verified' 
                                : 'Unverified'}
                          </span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {Math.round(item.verification.confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        {item.verification.reasons.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium mb-1">Reasons:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              {item.verification.reasons.map((reason, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="mr-1">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {item.verification.sources.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-1">Sources:</h4>
                            <div className="space-y-2">
                              {item.verification.sources.map((source, i) => (
                                <a
                                  key={i}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {source.name}
                                  {source.isTrusted && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Trusted
                                    </Badge>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerifyNews(item)}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Re-verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No news articles found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or scan for the latest news.
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify News</CardTitle>
              <CardDescription>
                Enter a news headline or paste the full article content to verify its authenticity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste news headline or article content here..."
                  value={verificationText}
                  onChange={(e) => setVerificationText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                
                {verificationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {verificationError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {verificationResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.status === 'verified' ? (
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        ) : verificationResult.status === 'partially_verified' ? (
                          <ShieldAlert className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <ShieldQuestion className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium">
                          {verificationResult.status === 'verified' 
                            ? 'Verified' 
                            : verificationResult.status === 'partially_verified'
                              ? 'Partially Verified' 
                              : 'Unverified'}
                        </span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {Math.round(verificationResult.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      {verificationResult.reasons.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Reasons:</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {verificationResult.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-1">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {verificationResult.sources.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-1">Sources:</h4>
                          <div className="space-y-2">
                            {verificationResult.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {source.name}
                                {source.isTrusted && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Trusted
                                  </Badge>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearVerification}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button 
                        onClick={handleVerifyCustomText}
                        disabled={isVerifying}
                        className="flex-1"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Re-verify
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleVerifyCustomText}
                    disabled={isVerifying || !verificationText.trim()}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Verify News
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Our verification system analyzes news content against multiple trusted sources to determine authenticity.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Verified: Content is confirmed by multiple trusted sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-yellow-500" />
                  <span>Partially Verified: Some claims need verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldQuestion className="h-4 w-4 text-gray-500" />
                  <span>Unverified: Unable to verify claims</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewsScanner;
