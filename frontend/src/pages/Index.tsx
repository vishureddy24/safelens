import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MediaScanner } from "@/components/scanner/MediaScanner";
import { NewsScanner } from "@/components/scanner/NewsScanner";
import { StockMonitor } from "@/components/scanner/StockMonitor";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "media":
        return <MediaScanner />;
      case "news":
        return <NewsScanner />;
      case "stocks":
        return <StockMonitor />;
      case "alerts":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Alert Center</h2>
            <p className="text-muted-foreground">Coming soon - Telegram alert management</p>
          </div>
        );
      case "admin":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Admin Panel</h2>
            <p className="text-muted-foreground">Coming soon - User and system management</p>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className={cn(
          "flex-1 transition-all duration-300 ml-64 p-6"
        )}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
