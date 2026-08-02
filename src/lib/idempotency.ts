import { v4 as uuidv4 } from 'uuid';

// Client-side utility for generating idempotency keys
// This can be used in client components without fs dependency
export function generateIdempotencyKey(): string {
  return uuidv4();
}
