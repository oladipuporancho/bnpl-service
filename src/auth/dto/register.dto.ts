import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('NG')
  phoneNumber: string;

  @IsNotEmpty()
  bvn: string;

  @IsNotEmpty()
  bankAccountNumber: string;

  @IsNotEmpty()
  idType: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string; // Add the password field
}
