import AppError from './AppError.js';

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

export default ValidationError;
