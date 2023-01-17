export class CookieOptions {
  public maxAge?: number;
  public expires?: Date;
  public path?: string;
  public domain?: string;
  public secure?: boolean;
  public sameSite?: boolean | 'lax' | 'strict' | 'none';
}
