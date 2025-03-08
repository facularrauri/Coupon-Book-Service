import { IsString, Length, IsEmail } from 'class-validator'

class LoginDTO {
  @IsEmail()
  email!: string

  @IsString()
  @Length(8, 20)
  password!: string
}

export { LoginDTO }
