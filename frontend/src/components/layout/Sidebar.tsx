import { 
  LayoutDashboard, 
  Video, 
  Newspaper, 
  TrendingUp, 
  Bell, 
  Shield, 
  Settings,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "media", label: "Media Scanner", icon: Video },
    { id: "news", label: "News Scanner", icon: Newspaper },
    { id: "stocks", label: "Stock Monitor", icon: TrendingUp },
    { id: "alerts", label: "Alert Center", icon: Bell },
    { id: "admin", label: "Admin Panel", icon: Shield },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-card transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-2 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-primary/10 text-primary border border-primary/20 glow-primary",
                  isCollapsed && "px-2"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary-glow")} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
        </div>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span>Settings</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};