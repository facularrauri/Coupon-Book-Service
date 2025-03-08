import { IsEmail, IsString, Length } from 'class-validator'

class CreateUserDTO {
  @IsString()
  @Length(3, 20)
  firstName!: string

  @IsString()
  @Length(3, 20)
  lastName!: string

  @IsString()
  @IsEmail()
  email!: string

  @IsString()
  @Length(8, 20)
  password!: string
}

export { CreateUserDTO }
