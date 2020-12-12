import { Expose } from 'class-transformer';

export class AbstractUser {
  @Expose({ groups: ['main', 'update'] })
  public id: number | string;
}
