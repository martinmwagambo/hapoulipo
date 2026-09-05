-- ============================================================
-- PostGIS Geo-Location System for Service Providers
-- Migration: 20260731120000_postgis_geo_location.sql
-- ============================================================

-- Step 1: Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Step 2: Add geography columns to service_providers
-- ============================================================
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Backfill existing rows that already have lat/lng
UPDATE public.service_providers
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- ============================================================
-- Step 3: Add geography columns to service_requests
-- ============================================================
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS pickup_location geography(POINT, 4326),
  ADD COLUMN IF NOT EXISTS dropoff_location geography(POINT, 4326);

-- Backfill existing rows
UPDATE public.service_requests
SET pickup_location = ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
WHERE pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL AND pickup_location IS NULL;

UPDATE public.service_requests
SET dropoff_location = ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326)::geography
WHERE dropoff_lat IS NOT NULL AND dropoff_lng IS NOT NULL AND dropoff_location IS NULL;

-- ============================================================
-- Step 4: Spatial indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_service_providers_location
  ON public.service_providers USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_service_requests_pickup_location
  ON public.service_requests USING GIST (pickup_location);

CREATE INDEX IF NOT EXISTS idx_service_requests_dropoff_location
  ON public.service_requests USING GIST (dropoff_location);

-- ============================================================
-- Step 5: Trigger function — keep location in sync with lat/lng
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_provider_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provider_location ON public.service_providers;
CREATE TRIGGER trg_provider_location
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_location();

-- ============================================================
-- Step 6: Trigger function — keep service_request geography in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_service_request_locations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
    NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
  END IF;
  IF NEW.dropoff_lat IS NOT NULL AND NEW.dropoff_lng IS NOT NULL THEN
    NEW.dropoff_location := ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_request_locations ON public.service_requests;
CREATE TRIGGER trg_service_request_locations
  BEFORE INSERT OR UPDATE OF pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
  ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_request_locations();

-- ============================================================
-- Step 7: Geo-ranked nearest provider function
-- Parameters:
--   p_user_lat    FLOAT8  — caller latitude
--   p_user_lng    FLOAT8  — caller longitude
--   p_type        TEXT    — provider_type enum value
--   p_user_county TEXT    — caller county (for county-priority sort)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_nearest_providers(
  p_user_lat    FLOAT8,
  p_user_lng    FLOAT8,
  p_type        TEXT,
  p_user_county TEXT DEFAULT NULL
)
RETURNS TABLE (
  id                UUID,
  provider_type     TEXT,
  business_name     TEXT,
  owner_user_id     UUID,
  whatsapp_number   TEXT,
  phone             TEXT,
  logo              TEXT,
  county            TEXT,
  sub_county        TEXT,
  latitude          FLOAT8,
  longitude         FLOAT8,
  is_online         BOOLEAN,
  rating            FLOAT8,
  base_fee_kes      INT,
  per_km_fee_kes    INT,
  service_radius_km INT,
  theme_color       TEXT,
  distance_km       FLOAT8,
  county_priority   INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    sp.id,
    sp.provider_type::TEXT,
    sp.business_name,
    sp.owner_user_id,
    sp.whatsapp_number,
    sp.phone,
    sp.logo,
    sp.county,
    sp.sub_county,
    sp.latitude,
    sp.longitude,
    sp.is_online,
    sp.rating,
    sp.base_fee_kes,
    sp.per_km_fee_kes,
    sp.service_radius_km,
    sp.theme_color,
    ROUND(
      (ST_Distance(
        sp.location,
        ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
      ) / 1000.0)::NUMERIC,
      2
    )::FLOAT8 AS distance_km,
    CASE
      WHEN p_user_county IS NOT NULL AND sp.county = p_user_county THEN 0
      ELSE 1
    END AS county_priority
  FROM public.service_providers sp
  WHERE
    sp.provider_type::TEXT = p_type
    AND sp.is_online = true
    AND sp.location IS NOT NULL
    AND ST_DWithin(
      sp.location,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
      COALESCE(sp.service_radius_km, 50) * 1000
    )
  ORDER BY
    county_priority ASC,
    distance_km ASC
  LIMIT 30;
$$;

-- ============================================================
-- Step 8: Distance-based fee calculation function
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_towing_fee(
  p_provider_id UUID,
  p_pickup_lat  FLOAT8,
  p_pickup_lng  FLOAT8
)
RETURNS TABLE (
  total_kes    INT,
  distance_km  FLOAT8,
  base_fee_kes INT,
  per_km_fee   INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (sp.base_fee_kes + ROUND(
      (ST_Distance(
        sp.location,
        ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography
      ) / 1000.0) * sp.per_km_fee_kes
    ))::INT AS total_kes,
    ROUND(
      (ST_Distance(
        sp.location,
        ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography
      ) / 1000.0)::NUMERIC,
      2
    )::FLOAT8 AS distance_km,
    sp.base_fee_kes,
    sp.per_km_fee_kes
  FROM public.service_providers sp
  WHERE sp.id = p_provider_id
    AND sp.location IS NOT NULL;
$$;

-- ============================================================
-- Step 9: Active towing providers view
-- ============================================================
DROP VIEW IF EXISTS public.active_towing_providers;
CREATE VIEW public.active_towing_providers AS
SELECT
  sp.*,
  ST_Y(sp.location::geometry) AS lat,
  ST_X(sp.location::geometry) AS lng
FROM public.service_providers sp
WHERE sp.provider_type = 'towing'
  AND sp.is_online = true
  AND sp.location IS NOT NULL;
