import { QUEUES, RabbitMQService } from '@/lib/rabbitMQ'
import { CouponModel, CouponBookModel } from '@/components'
import { generateRandomCode } from '@/utils/codeGenerator'
import { Database } from '@/lib/database.js'
import { logger } from '@/logger'
import createError from 'http-errors'

interface ICodeData {
  couponBookId: string
  quantity: number
  batchSize?: number
}

async function processCodeGeneration(data: ICodeData, database: Database) {
  const { couponBookId, quantity, batchSize = 1000 } = data
  logger.info(`Starting code generation for ${quantity} codes for book ${couponBookId}`)

  const session = await database.startSession()
  try {
    session.startTransaction()

    const couponBook = await CouponBookModel.findById(couponBookId, {}, { session })

    if (!couponBook) {
      throw createError(404, `Coupon book ${couponBookId} not found`)
    }

    let generatedCount = 0

    for (let i = 0; i < quantity; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, quantity - i)
      const couponsToCreate = []

      for (let j = 0; j < currentBatchSize; j++) {
        const code = generateRandomCode(couponBook.codePattern)
        couponsToCreate.push({
          couponBookId,
          code,
          isAssigned: false,
          isRedeemed: false,
          redemptionCount: 0,
          lockedUntil: null,
        })
      }

      // Insertar lote de cupones
      await CouponModel.insertMany(couponsToCreate, { session })
      generatedCount += couponsToCreate.length

      logger.verbose(`Generated ${generatedCount} of ${quantity} codes for book ${couponBookId}`)
    }

    // Actualizar contador en el libro de cupones
    await CouponBookModel.updateOne(
      { _id: couponBookId },
      { $inc: { totalCodes: generatedCount } },
      { session },
    )

    await session.commitTransaction()

    logger.verbose(`Code generation completed: ${generatedCount} codes for book ${couponBookId}`)

    return {
      couponBookId,
      generatedCodes: generatedCount,
      totalCodes: couponBook.totalCodes + generatedCount,
    }
  } catch (error) {
    await session.abortTransaction()
    logger.error('Error en generating codes:', error)
    throw error
  } finally {
    session.endSession()
  }
}

export async function startCodeGenerationWorker(
  rabbitMQService: RabbitMQService,
  database: Database,
) {
  try {
    await rabbitMQService.consumeMessages(QUEUES.CODE_GENERATION, (message: ICodeData) =>
      processCodeGeneration(message, database),
    )
  } catch (error) {
    logger.error('Error running code generator worker:', error)
    throw error
  }
}
