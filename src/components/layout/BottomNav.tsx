import { Home, Shield, MessageCircle } from "lucide-react";

type NavTab = "home" | "diagnose" | "talk";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: "home" as NavTab, label: "Home", icon: Home },
    { id: "diagnose" as NavTab, label: "Diagnose", icon: Shield },
    { id: "talk" as NavTab, label: "Talk", icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
