export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
}

export function success<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function error(errorCode: string, message: string): ActionResult {
  return { success: false, errorCode, message };
}

export function insufficientPointsError(availableBalance: number): ActionResult {
  return error(
    'INSUFFICIENT_POINTS',
    `Unable to redeem points. Available balance: ${availableBalance} points.`
  );
}

export function duplicatePhoneError(): ActionResult {
  return error(
    'DUPLICATE_PHONE',
    'Phone number already exists. Please search for the existing customer.'
  );
}

export function cardAlreadyAssignedError(): ActionResult {
  return error(
    'CARD_ALREADY_ASSIGNED',
    'This loyalty card has already been assigned to another customer.'
  );
}

export function customerNotFoundError(): ActionResult {
  return error(
    'CUSTOMER_NOT_FOUND',
    'Customer not found. Please verify the customer exists.'
  );
}

export function validationError(message: string): ActionResult {
  return error('VALIDATION_ERROR', message);
}

export function serverError(message: string = 'An unexpected error occurred. Please try again.'): ActionResult {
  return error('SERVER_ERROR', message);
}
