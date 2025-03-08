class ValidationError extends Error {
  statusCode: number
  validationErrors: any

  constructor(validationErrors: any) {
    super()
    this.name = 'ValidationError'
    this.statusCode = 400
    this.validationErrors = validationErrors
  }
}

export { ValidationError }
