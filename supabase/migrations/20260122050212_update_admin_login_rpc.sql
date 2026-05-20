-- Drop the existing function and recreate it without the UPDATE statement
-- The UPDATE was causing issues because RPC calls from the frontend are in read-only context

CREATE OR REPLACE FUNCTION public.admin_login(p_username text, p_password text)
RETURNS TABLE(success boolean, admin_name text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin 
  FROM public.admin_credentials 
  WHERE username = p_username 
    AND password_hash = p_password 
    AND is_active = true;
  
  IF v_admin.id IS NOT NULL THEN
    -- Return success without updating last_login (can be done separately if needed)
    RETURN QUERY SELECT true, v_admin.display_name, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, 'Invalid credentials'::TEXT;
  END IF;
END;
$$;