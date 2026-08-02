export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
}

export function success<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function error<T = void>(errorCode: string, message: string): ActionResult<T> {
  return { success: false, errorCode, message };
}

export function insufficientPointsError<T = void>(availableBalance: number): ActionResult<T> {
  return error(
    'INSUFFICIENT_POINTS',
    `Unable to redeem points. Available balance: ${availableBalance} points.`
  );
}

export function duplicatePhoneError<T = void>(): ActionResult<T> {
  return error(
    'DUPLICATE_PHONE',
    'Phone number already exists. Please search for the existing customer.'
  );
}

export function cardAlreadyAssignedError<T = void>(): ActionResult<T> {
  return error(
    'CARD_ALREADY_ASSIGNED',
    'This loyalty card has already been assigned to another customer.'
  );
}

export function customerNotFoundError<T = void>(): ActionResult<T> {
  return error(
    'CUSTOMER_NOT_FOUND',
    'Customer not found. Please verify the customer exists.'
  );
}

export function validationError<T = void>(message: string): ActionResult<T> {
  return error('VALIDATION_ERROR', message);
}

export function serverError<T = void>(message: string = 'An unexpected error occurred. Please try again.'): ActionResult<T> {
  return error('SERVER_ERROR', message);
}
