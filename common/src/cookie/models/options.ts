export class CookieOptions {
  public maxAge?: number | undefined;
  public expires?: Date | undefined;
  public path?: string | undefined;
  public domain?: string | undefined;
  public secure?: boolean | undefined;
  public sameSite?: 'lax' | 'strict' | 'none' | undefined;
}
