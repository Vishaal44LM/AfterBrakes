-- Add fuel column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN fuel text DEFAULT 'petrol';

-- Add a check constraint for valid fuel types
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_fuel_check CHECK (fuel IN ('petrol', 'diesel', 'cng', 'ev'));