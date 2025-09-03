import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, Eye } from "lucide-react";
import { RiskCard } from "./RiskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const DashboardOverview = () => {
  const recentAlerts = [
    {
      id: 1,
      type: "Stock Manipulation",
      ticker: "AMZN",
      risk: "danger" as const,
      message: "Unusual volume spike detected - possible pump scheme",
      time: "2 minutes ago"
    },
    {
      id: 2,
      type: "Deepfake Video",
      risk: "warning" as const,
      message: "Suspicious promotional video flagged by AI",
      time: "15 minutes ago"
    },
    {
      id: 3,
      type: "News Fraud",
      risk: "danger" as const,
      message: "Fake SEBI approval letter circulating",
      time: "1 hour ago"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RiskCard
          title="Overall Risk Level"
          value="72"
          riskLevel="danger"
          change="+12%"
          icon={<Shield className="h-5 w-5" />}
          description="High fraud activity detected"
        />
        <RiskCard
          title="Active Scans"
          value="1,247"
          riskLevel="safe"
          change="+3%"
          icon={<Activity className="h-5 w-5" />}
          description="Real-time monitoring"
        />
        <RiskCard
          title="Threats Blocked"
          value="89"
          riskLevel="warning"
          change="+23%"
          icon={<AlertTriangle className="h-5 w-5" />}
          description="This week"
        />
        <RiskCard
          title="Protection Rate"
          value="98.7%"
          riskLevel="safe"
          change="+0.2%"
          icon={<CheckCircle className="h-5 w-5" />}
          description="User protection success"
        />
      </div>

      {/* Recent Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent High-Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        alert.risk === "danger" 
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {alert.type}
                    </Badge>
                    {alert.ticker && (
                      <Badge variant="secondary">{alert.ticker}</Badge>
                    )}
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Watchlist Risk Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { ticker: "AAPL", price: "$173.50", change: "-2.1%", risk: "safe" },
              { ticker: "TSLA", price: "$248.42", change: "+5.7%", risk: "warning" },
              { ticker: "AMZN", price: "$142.81", change: "+15.3%", risk: "danger" },
              { ticker: "GOOGL", price: "$138.21", change: "+1.2%", risk: "safe" },
            ].map((stock) => (
              <div key={stock.ticker} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{stock.ticker}</Badge>
                  <div>
                    <p className="font-medium">{stock.price}</p>
                    <p className={`text-xs ${stock.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                      {stock.change}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    stock.risk === "danger" 
                      ? "bg-destructive/10 text-destructive border-destructive/20 animate-risk-pulse"
                      : stock.risk === "warning"
                      ? "bg-warning/10 text-warning border-warning/20"
                      : "bg-success/10 text-success border-success/20"
                  }
                >
                  {stock.risk === "danger" ? "HIGH RISK" : stock.risk === "warning" ? "MODERATE" : "SAFE"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};