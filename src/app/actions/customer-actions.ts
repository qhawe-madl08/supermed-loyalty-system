'use server';

import { createSupabaseServerClient } from '@/lib/auth';
import { getAuthenticatedTenantId } from '@/lib/tenant-helper';
import { ActionResult, success, duplicatePhoneError, serverError, validationError } from '@/lib/action-response';
import { logCustomerEvent, logCardEvent } from '@/services/audit/audit.service';
import type { LegacyCustomerRecord } from '@/types';

export async function enrollCustomer(formData: FormData): Promise<ActionResult<LegacyCustomerRecord>> {
  try {
    const firstName = String(formData.get('first_name') ?? '').trim();
    const lastName = String(formData.get('last_name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const cardCode = String(formData.get('card_code') ?? '').trim();

    if (!firstName || !lastName || !phone) {
      return validationError<LegacyCustomerRecord>('First name, last name, and phone are required.');
    }

    const tenantId = await getAuthenticatedTenantId();
    if (!tenantId) {
      return serverError('Authentication required');
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // Use atomic RPC function for customer + card assignment
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc('register_customer_with_card', {
      p_tenant_id: tenantId,
      p_full_name: fullName,
      p_phone_e164: phone,
      p_email: email || null,
      p_card_code: cardCode || null,
    });

    if (error) {
      console.error('Atomic registration error:', error);
      
      // Handle specific errors
      if (error.message.includes('duplicate key')) {
        return duplicatePhoneError();
      }
      if (error.message.includes('Card not available')) {
        return serverError('Card is not available for assignment.');
      }
      
      return serverError(error.message || 'Failed to register customer');
    }

    if (!data || !data.success) {
      return serverError('Failed to register customer');
    }

    // Fetch the created customer for response
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*, loyalty_cards!loyalty_cards_customer_id_fkey(id, status)')
      .eq('id', data.customer_id)
      .single();

    if (fetchError || !customer) {
      console.error('Failed to fetch created customer:', fetchError);
      return serverError('Customer created but failed to retrieve details');
    }

    const activeCard = (customer.loyalty_cards as Array<{ id: string; status: string }> | null)
      ?.find((c) => c.status === 'active') ?? null;
    const { loyalty_cards: _, ...customerData } = customer;

    // Convert to legacy format
    const nameParts = customerData.full_name.trim().split(' ');
    const legacyCustomer: LegacyCustomerRecord = {
      id: customerData.id,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: customerData.phone_e164,
      email: customerData.email,
      points_balance: customerData.points_balance,
      card_id: activeCard?.id ?? null,
      created_at: customerData.created_at,
    };

    // Audit customer creation
    await logCustomerEvent('created', legacyCustomer.id, undefined, {
      first_name: legacyCustomer.first_name,
      last_name: legacyCustomer.last_name,
      phone: legacyCustomer.phone,
      email: legacyCustomer.email,
    });

    // Audit card assignment
    if (activeCard) {
      await logCardEvent('assigned', activeCard.id,
        { status: 'available', customer_id: null },
        { status: 'active', customer_id: legacyCustomer.id }
      );
    }

    return success(legacyCustomer);
  } catch (error) {
    console.error('Customer enrollment error:', error);
    
    if (error instanceof Error && error.message === 'DUPLICATE_PHONE') {
      return duplicatePhoneError();
    }

    return serverError();
  }
}
