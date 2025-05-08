import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // can be email or phone

  @IsString()
  @IsNotEmpty()
  password: string;
}
