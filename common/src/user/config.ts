export class UserConfig {
  public userModel: new(user: any) => any;
  public userService: any;
  public profileRelations?: Array<string>;
  public profileRelationsKey?: string;
}
