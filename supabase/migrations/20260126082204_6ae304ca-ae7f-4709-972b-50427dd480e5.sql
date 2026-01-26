-- Add input validation triggers instead of CHECK constraints for time-based validations
-- This follows Supabase best practices for immutability requirements

-- 1. Create validation function for feed_entries
CREATE OR REPLACE FUNCTION public.validate_feed_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate quantity range (0-500ml is reasonable for baby feeding)
  IF NEW.quantity < 0 OR NEW.quantity > 500 THEN
    RAISE EXCEPTION 'Feed quantity must be between 0 and 500ml';
  END IF;
  
  -- Validate date_time is not too far in the future (allow 1 hour for timezone issues)
  IF NEW.date_time > NOW() + INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Feed date/time cannot be in the future';
  END IF;
  
  -- Validate fed_by length
  IF char_length(NEW.fed_by) > 100 THEN
    RAISE EXCEPTION 'Fed by name must be 100 characters or less';
  END IF;
  
  -- Validate feed_type length
  IF char_length(NEW.feed_type) > 50 THEN
    RAISE EXCEPTION 'Feed type must be 50 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create validation function for measurements
CREATE OR REPLACE FUNCTION public.validate_measurement()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate weight range (0.5-30kg covers premature babies to toddlers)
  IF NEW.weight_kg IS NOT NULL AND (NEW.weight_kg < 0.5 OR NEW.weight_kg > 30) THEN
    RAISE EXCEPTION 'Weight must be between 0.5 and 30 kg';
  END IF;
  
  -- Validate height range (30-150cm covers newborns to toddlers)
  IF NEW.height_cm IS NOT NULL AND (NEW.height_cm < 30 OR NEW.height_cm > 150) THEN
    RAISE EXCEPTION 'Height must be between 30 and 150 cm';
  END IF;
  
  -- Validate date_time is not in the future
  IF NEW.date_time > NOW() + INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Measurement date/time cannot be in the future';
  END IF;
  
  -- Validate notes length
  IF NEW.notes IS NOT NULL AND char_length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Notes must be 500 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create validation function for babies
CREATE OR REPLACE FUNCTION public.validate_baby()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate name length
  IF char_length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Baby name must be 100 characters or less';
  END IF;
  
  -- Validate date_of_birth is not in the future
  IF NEW.date_of_birth > CURRENT_DATE THEN
    RAISE EXCEPTION 'Date of birth cannot be in the future';
  END IF;
  
  -- Validate date_of_birth is reasonable (not before 2015)
  IF NEW.date_of_birth < '2015-01-01'::date THEN
    RAISE EXCEPTION 'Date of birth must be after January 1, 2015';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create validation function for poop_entries
CREATE OR REPLACE FUNCTION public.validate_poop_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate date_time is not in the future
  IF NEW.date_time > NOW() + INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Poop entry date/time cannot be in the future';
  END IF;
  
  -- Validate colour length
  IF char_length(NEW.colour) > 50 THEN
    RAISE EXCEPTION 'Colour must be 50 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create validation function for photos
CREATE OR REPLACE FUNCTION public.validate_photo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  file_extension TEXT;
  allowed_extensions TEXT[] := ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'];
BEGIN
  -- Validate caption length
  IF NEW.caption IS NOT NULL AND char_length(NEW.caption) > 500 THEN
    RAISE EXCEPTION 'Caption must be 500 characters or less';
  END IF;
  
  -- Validate photo_type length
  IF char_length(NEW.photo_type) > 50 THEN
    RAISE EXCEPTION 'Photo type must be 50 characters or less';
  END IF;
  
  -- Extract and validate file extension
  file_extension := lower(substring(NEW.storage_path FROM '\.([^.]+)$'));
  IF file_extension IS NULL OR NOT (file_extension = ANY(allowed_extensions)) THEN
    RAISE EXCEPTION 'File type not allowed. Allowed: jpg, jpeg, png, gif, webp, mp4, mov, webm';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create triggers for all tables
CREATE TRIGGER validate_feed_entry_trigger
  BEFORE INSERT OR UPDATE ON public.feed_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_feed_entry();

CREATE TRIGGER validate_measurement_trigger
  BEFORE INSERT OR UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_measurement();

CREATE TRIGGER validate_baby_trigger
  BEFORE INSERT OR UPDATE ON public.babies
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_baby();

CREATE TRIGGER validate_poop_entry_trigger
  BEFORE INSERT OR UPDATE ON public.poop_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_poop_entry();

CREATE TRIGGER validate_photo_trigger
  BEFORE INSERT OR UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_photo();