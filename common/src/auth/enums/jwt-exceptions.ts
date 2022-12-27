export enum JwtExceptions {
  TOKEN_BLACKLISTED = 'The token has been blacklisted',
  TOKEN_INVALID = 'Token Signature could not be verified.',
  TOKEN_CANNOT_REFRESH = 'Token has expired and can no longer be refreshed',
  TOKEN_EXPIRED = 'Token has expired'
}
