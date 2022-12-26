export class UserConfig {
  public userModel: new (user: any) => any;
  public userService: new (...args: Array<any>) => any;
  public profileRelations?: Array<string>;
  public profileRelationsKey?: string;
}
