import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Run after an array of express-validator checks to short-circuit with a 400
// if any of them failed.
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest(
      'Validation failed',
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
}
