import AppError from './AppError.js';

class AuthError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, details);
  }
}

export default AuthError;
