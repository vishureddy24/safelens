import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import VerificationStatus from '@/components/verification/VerificationStatus';
import { Loader2 } from 'lucide-react';

interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified';
  confidence: number;
  sources: Array<{
    name: string;
    url: string;
    publishedAt: string;
    isTrusted: boolean;
  }>;
  reasons: string[];
}

const NewsVerification = () => {
  const [headline, setHeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyHeadline = async () => {
    if (!headline.trim()) {
      setError('Please enter a headline to verify');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/news/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headline }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify headline');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError('An error occurred while verifying the headline');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">News Verification</h1>
        <p className="text-muted-foreground">
          Enter a news headline to verify its authenticity using multiple trusted sources
        </p>
      </div>

      <div className="flex space-x-2">
        <Input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Enter news headline to verify..."
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && verifyHeadline()}
          disabled={isLoading}
        />
        <Button 
          onClick={verifyHeadline}
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <VerificationStatus 
            status={result.status} 
            confidence={result.confidence}
            reasons={result.reasons}
          />
          
          {result.sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Sources:</h3>
              <div className="space-y-2">
                {result.sources.map((source, index) => (
                  <div 
                    key={index}
                    className="p-3 border rounded-md hover:bg-muted/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {source.name}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          {new Date(source.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {source.isTrusted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Trusted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsVerification;
