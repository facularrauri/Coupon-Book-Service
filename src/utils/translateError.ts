export function translateError(message: string): string {
  const translations: { [key: string]: string } = {
    'email must be unique': 'Este email ya se encuentra en uso',
    'email must be an email': 'El correo electrónico debe ser un correo electrónico valido',
    'password must be longer than or equal to 8 characters':
      'La contraseña debe tener al menos 8 caracteres',
    'password must be a string': 'La contraseña debe ser texto',
  }

  for (const [key, value] of Object.entries(translations)) {
    message = message.replace(key, value)
  }
  return message
}
