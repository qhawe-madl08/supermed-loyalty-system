-- Atomic customer creation with card assignment
-- This ensures that customer creation and card assignment happen in a single transaction
-- If card assignment fails, the customer is rolled back

CREATE OR REPLACE FUNCTION register_customer_with_card(
  p_tenant_id UUID,
  p_full_name TEXT,
  p_phone_e164 TEXT,
  p_email TEXT DEFAULT NULL,
  p_card_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_card_id UUID;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  
  IF p_phone_e164 IS NULL OR p_phone_e164 = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  
  -- Begin transaction
  BEGIN
    -- Create customer
    INSERT INTO customers (
      tenant_id,
      full_name,
      phone_e164,
      email,
      preferred_channel,
      is_active
    ) VALUES (
      p_tenant_id,
      p_full_name,
      p_phone_e164,
      p_email,
      'whatsapp',
      true
    ) RETURNING id INTO v_customer_id;
    
    -- Handle card assignment
    IF p_card_code IS NOT NULL AND p_card_code != '' THEN
      -- Find the card
      SELECT id INTO v_card_id
      FROM loyalty_cards
      WHERE card_code = p_card_code
        AND tenant_id = p_tenant_id
        AND status = 'available'
        AND customer_id IS NULL
      FOR UPDATE;
      
      IF v_card_id IS NULL THEN
        RAISE EXCEPTION 'Card not available for assignment';
      END IF;
      
      -- Assign card
      UPDATE loyalty_cards
      SET 
        customer_id = v_customer_id,
        status = 'active',
        issued_at = NOW()
      WHERE id = v_card_id;
      
    ELSE
      -- Create new card
      INSERT INTO loyalty_cards (
        tenant_id,
        customer_id,
        card_code,
        card_type,
        status,
        issued_at
      ) VALUES (
        p_tenant_id,
        v_customer_id,
        gen_random_uuid()::text,
        'qr',
        'active',
        NOW()
      ) RETURNING id INTO v_card_id;
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
      'success', true,
      'customer_id', v_customer_id,
      'card_id', v_card_id
    );
    
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      RAISE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION register_customer_with_card TO authenticated;
