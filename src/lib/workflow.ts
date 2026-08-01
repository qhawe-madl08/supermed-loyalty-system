export interface WorkflowCustomerSummary {
  first_name: string;
  last_name: string;
  phone: string;
}

export function formatCustomerName(customer: WorkflowCustomerSummary): string {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
  return fullName || customer.phone;
}
