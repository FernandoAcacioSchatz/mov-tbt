export class ServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

interface PgLikeError { message: string; code?: string }

/** Converte erros técnicos em mensagens amigáveis, sem vazar detalhes internos. */
export function friendlyError(error: PgLikeError, fallback: string): ServiceError {
  if (error.code === '42501') return new ServiceError('Você não tem permissão para esta ação.', error.code);
  if (error.code === '23514') return new ServiceError('Algum campo está fora do formato permitido. Confira os dados.', error.code);
  if (error.code === '23505') return new ServiceError('Este registro já existe.', error.code);
  if (error.code === 'P0001' && error.message) return new ServiceError(error.message, error.code);
  return new ServiceError(fallback, error.code);
}
