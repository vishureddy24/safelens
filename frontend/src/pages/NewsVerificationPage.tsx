import React from 'react';
import { useQuery } from '@tanstack/react-query';
import NewsVerification from '@/components/verification/NewsVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NewsVerificationPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">News Verification</CardTitle>
          <p className="text-muted-foreground">
            Verify the authenticity of news articles using our trusted verification system
          </p>
        </CardHeader>
        <CardContent>
          <NewsVerification />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsVerificationPage;
