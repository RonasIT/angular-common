export class UserConfig {
  public userModel: { new(user: any): any };
  public userService: Function;
  public profileRelations?: Array<string>;
  public profileRelationsKey?: string;
}
