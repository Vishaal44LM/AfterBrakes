 import { Shield, MessageCircle, Car, History, Zap, HelpCircle } from "lucide-react";
 import { Vehicle } from "@/hooks/useVehicles";
 import logo from "@/assets/logo.png";
 
 interface HomeScreenProps {
   vehicle: Vehicle | null;
   onOpenGarage: () => void;
   onStartDiagnose: () => void;
   onStartTalk: () => void;
   onOpenHistory: () => void;
   onOpenSideQuests: () => void;
   onOpenLightsOut?: () => void;
   onOpenDriveTimeQA?: () => void;
 }
 
 const HomeScreen = ({ 
   vehicle, 
   onOpenGarage, 
   onStartDiagnose, 
   onStartTalk,
   onOpenHistory,
   onOpenLightsOut,
   onOpenDriveTimeQA
 }: HomeScreenProps) => {
   return (
     <div className="fixed inset-0 bg-background overflow-hidden">
       {/* Animated background grid */}
       <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
       
       {/* Gradient orbs for depth */}
       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-drift" />
       <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-drift-delayed" />
 
       {/* Main orbital layout container */}
       <div className="relative h-full flex items-center justify-center p-4">
         
         {/* Center Focus Module - The Presence */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
           <div className="relative">
             {/* Pulsing glow ring */}
             <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl animate-pulse-slow" />
             
             {/* Center orb */}
             <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-card via-card to-secondary/50 border border-border/30 flex flex-col items-center justify-center shadow-2xl shadow-primary/10">
               <img src={logo} alt="After Brakes" className="w-12 h-12 sm:w-14 sm:h-14 mb-1" />
               <span className="text-xs sm:text-sm font-medium text-muted-foreground">After Brakes</span>
               {vehicle && (
                 <span className="text-[10px] sm:text-xs text-muted-foreground/50 mt-0.5">
                   {vehicle.manufacturer} {vehicle.model}
                 </span>
               )}
             </div>
           </div>
         </div>
 
         {/* Orbital Navigation Tiles */}
         
         {/* Pit Crew Check - TOP (Largest) */}
         <button
           onClick={onStartDiagnose}
           className="orbital-tile orbital-tile-primary absolute top-[8%] sm:top-[12%] left-1/2 -translate-x-1/2"
         >
           <div className="orbital-tile-inner w-36 h-24 sm:w-44 sm:h-28">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-2">
               <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
             </div>
             <span className="text-sm sm:text-base font-semibold text-foreground">Pit Crew Check</span>
             <span className="text-[10px] sm:text-xs text-muted-foreground/60">Predict risks</span>
           </div>
         </button>
 
         {/* Pit Lane Talk - BOTTOM (Second Largest) */}
         <button
           onClick={onStartTalk}
           className="orbital-tile orbital-tile-secondary absolute bottom-[8%] sm:bottom-[12%] left-1/2 -translate-x-1/2"
         >
           <div className="orbital-tile-inner w-32 h-20 sm:w-40 sm:h-24">
             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-secondary/40 flex items-center justify-center mb-2">
               <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/80" />
             </div>
             <span className="text-sm sm:text-base font-medium text-foreground/90">Pit Lane Talk</span>
             <span className="text-[10px] sm:text-xs text-muted-foreground/50">Ask anything</span>
           </div>
         </button>
 
         {/* Garage - LEFT (Compact) */}
         <button
           onClick={onOpenGarage}
           className="orbital-tile orbital-tile-compact absolute left-[5%] sm:left-[15%] top-1/2 -translate-y-1/2"
         >
           <div className="orbital-tile-inner w-20 h-20 sm:w-24 sm:h-24">
             <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/30 flex items-center justify-center mb-1.5">
               <Car className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
             </div>
             <span className="text-xs sm:text-sm font-medium text-foreground/70">Garage</span>
           </div>
         </button>
 
         {/* History - RIGHT (Compact) */}
         <button
           onClick={onOpenHistory}
           className="orbital-tile orbital-tile-compact absolute right-[5%] sm:right-[15%] top-1/2 -translate-y-1/2"
         >
           <div className="orbital-tile-inner w-20 h-20 sm:w-24 sm:h-24">
             <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/30 flex items-center justify-center mb-1.5">
               <History className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
             </div>
             <span className="text-xs sm:text-sm font-medium text-foreground/70">History</span>
           </div>
         </button>
 
         {/* Lights Out - BOTTOM LEFT (Medium) */}
         <button
           onClick={onOpenLightsOut}
           className="orbital-tile orbital-tile-medium absolute bottom-[22%] sm:bottom-[28%] left-[8%] sm:left-[18%]"
         >
           <div className="orbital-tile-inner w-24 h-16 sm:w-28 sm:h-20">
             <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-1">
               <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
             </div>
             <span className="text-xs sm:text-sm font-medium text-foreground/60">Lights Out</span>
           </div>
         </button>
 
         {/* Drive Time Q&A - BOTTOM RIGHT (Medium) */}
         <button
           onClick={onOpenDriveTimeQA}
           className="orbital-tile orbital-tile-medium absolute bottom-[22%] sm:bottom-[28%] right-[8%] sm:right-[18%]"
         >
           <div className="orbital-tile-inner w-24 h-16 sm:w-28 sm:h-20">
             <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-1">
               <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
             </div>
             <span className="text-xs sm:text-sm font-medium text-foreground/60">Drive Time Q&A</span>
           </div>
         </button>
 
       </div>
     </div>
   );
 };
 
 export default HomeScreen;
