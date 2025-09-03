import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface VerificationStatusProps {
  status: 'verified' | 'partially_verified' | 'unverified';
  confidence: number;
  reasons: string[];
}

const VerificationStatus = ({ status, confidence, reasons }: VerificationStatusProps) => {
  const statusConfig = {
    verified: {
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
      title: 'Verified',
      description: 'This news appears to be accurate based on multiple trusted sources.',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
    },
    partially_verified: {
      icon: <AlertCircle className="h-6 w-6 text-yellow-500" />,
      title: 'Partially Verified',
      description: 'This news has some verification but should be cross-checked.',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
    },
    unverified: {
      icon: <HelpCircle className="h-6 w-6 text-red-500" />,
      title: 'Not Verified',
      description: 'Unable to verify this news from trusted sources. Proceed with caution.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className={`p-4 border rounded-lg ${currentStatus.bgColor} ${currentStatus.borderColor} border`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {currentStatus.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${currentStatus.textColor}`}>
            {currentStatus.title}
          </h3>
          <p className="mt-1 text-sm text-gray-700">
            {currentStatus.description}
          </p>
          
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm font-semibold">{confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  status === 'verified' ? 'bg-green-500' : 
                  status === 'partially_verified' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {reasons.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Analysis</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationStatus;
