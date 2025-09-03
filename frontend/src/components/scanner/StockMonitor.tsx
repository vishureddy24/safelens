import { useState } from "react";
import { TrendingUp, Plus, AlertTriangle, Activity, DollarSign, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  riskScore: number;
  alerts: string[];
}

export const StockMonitor = () => {
  const [newTicker, setNewTicker] = useState("");
  const [watchlist, setWatchlist] = useState<StockData[]>([
    {
      ticker: "AAPL",
      name: "Apple Inc.",
      price: 173.50,
      change: -3.62,
      changePercent: -2.1,
      volume: 45000000,
      avgVolume: 50000000,
      riskScore: 15,
      alerts: []
    },
    {
      ticker: "TSLA", 
      name: "Tesla Inc.",
      price: 248.42,
      change: 13.45,
      changePercent: 5.7,
      volume: 95000000,
      avgVolume: 35000000,
      riskScore: 65,
      alerts: ["Volume spike detected", "Unusual price movement"]
    },
    {
      ticker: "AMZN",
      name: "Amazon.com Inc.",
      price: 142.81,
      change: 18.96,
      changePercent: 15.3,
      volume: 180000000,
      avgVolume: 45000000,
      riskScore: 92,
      alerts: ["Possible pump-and-dump", "Coordinated social media hype", "Volume 4x normal"]
    },
    {
      ticker: "GOOGL",
      name: "Alphabet Inc.",
      price: 138.21,
      change: 1.64,
      changePercent: 1.2,
      volume: 28000000,
      avgVolume: 30000000,
      riskScore: 8,
      alerts: []
    }
  ]);

  const getRiskConfig = (score: number) => {
    if (score >= 70) return {
      level: "danger",
      label: "HIGH RISK",
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20"
    };
    if (score >= 40) return {
      level: "warning",
      label: "MODERATE", 
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20"
    };
    return {
      level: "safe",
      label: "LOW RISK",
      color: "text-success", 
      bg: "bg-success/10 border-success/20"
    };
  };

  const addToWatchlist = () => {
    if (newTicker && !watchlist.find(stock => stock.ticker === newTicker.toUpperCase())) {
      // Mock data for new ticker
      const newStock: StockData = {
        ticker: newTicker.toUpperCase(),
        name: `${newTicker.toUpperCase()} Corp.`,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 10,
        volume: Math.floor(Math.random() * 100000000),
        avgVolume: Math.floor(Math.random() * 50000000),
        riskScore: Math.floor(Math.random() * 100),
        alerts: []
      };
      setWatchlist([...watchlist, newStock]);
      setNewTicker("");
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    return `${(volume / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Monitor</h2>
          <p className="text-muted-foreground">
            Real-time pump-and-dump detection and anomaly analysis
          </p>
        </div>
      </div>

      {/* Add to Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add to Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Enter ticker symbol (e.g., AAPL)"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            className="flex-1"
            onKeyPress={(e) => e.key === "Enter" && addToWatchlist()}
          />
          <Button onClick={addToWatchlist} variant="security">
            Add Stock
          </Button>
        </CardContent>
      </Card>

      {/* Watchlist */}
      <div className="grid gap-4">
        {watchlist.map((stock) => {
          const riskConfig = getRiskConfig(stock.riskScore);
          const volumeRatio = stock.volume / stock.avgVolume;
          
          return (
            <Card 
              key={stock.ticker} 
              className={`transition-all duration-300 hover:scale-[1.01] ${
                riskConfig.level === "danger" ? "ring-1 ring-destructive/20 glow-danger animate-risk-pulse" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{stock.ticker}</h3>
                        <Badge variant="outline">{stock.name}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">${stock.price.toFixed(2)}</span>
                          <span className={`text-sm ${stock.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatVolume(stock.volume)} 
                            {volumeRatio > 2 && (
                              <span className="text-warning ml-1">
                                ({volumeRatio.toFixed(1)}x avg)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {stock.alerts.length > 0 && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span className="text-sm font-medium">Alerts</span>
                        </div>
                        <div className="space-y-1">
                          {stock.alerts.map((alert, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {alert}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`${riskConfig.bg} ${riskConfig.color} font-medium mb-2`}
                      >
                        {riskConfig.label}
                      </Badge>
                      <div className="text-2xl font-bold">{stock.riskScore}</div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
                    </div>

                    <div className="h-16 w-24 bg-muted/20 rounded flex items-center justify-center">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {watchlist.filter(s => s.riskScore >= 70).length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk Stocks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {watchlist.filter(s => s.riskScore >= 40 && s.riskScore < 70).length}
            </div>
            <div className="text-sm text-muted-foreground">Moderate Risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {watchlist.filter(s => s.riskScore < 40).length}
            </div>
            <div className="text-sm text-muted-foreground">Low Risk</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};