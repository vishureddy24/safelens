import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskCardProps {
  title: string;
  value: string;
  riskLevel: "safe" | "warning" | "danger";
  change?: string;
  icon: React.ReactNode;
  description?: string;
}

export const RiskCard = ({ 
  title, 
  value, 
  riskLevel, 
  change, 
  icon, 
  description 
}: RiskCardProps) => {
  const riskConfig = {
    safe: {
      bg: "risk-safe",
      badge: "bg-success/10 text-success border-success/20",
      glow: "glow-success"
    },
    warning: {
      bg: "risk-warning", 
      badge: "bg-warning/10 text-warning border-warning/20",
      glow: "glow-warning"
    },
    danger: {
      bg: "risk-danger",
      badge: "bg-destructive/10 text-destructive border-destructive/20", 
      glow: "glow-danger"
    }
  };

  const config = riskConfig[riskLevel];

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-105",
      config.bg,
      config.glow
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {change && (
            <Badge variant="outline" className={config.badge}>
              {change}
            </Badge>
          )}
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-line" />
    </Card>
  );
};