import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  fuel: "petrol" | "diesel" | "cng" | "ev";
  is_active: boolean;
}

export const useVehicles = (userId: string | undefined) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const vehicleData = (data || []) as Vehicle[];
      setVehicles(vehicleData);
      
      const active = vehicleData.find((v) => v.is_active);
      setActiveVehicle(active || null);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    activeVehicle,
    setActiveVehicle,
    loading,
    refresh: fetchVehicles,
  };
};
