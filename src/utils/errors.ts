/**
 * Security utility to sanitize error messages before showing to users.
 * Prevents information leakage about database structure and internal logic.
 */

export const getUserFriendlyError = (error: any): string => {
  // Log detailed error for debugging (server-side logs only)
  console.error('Internal error:', error);
  
  // Map PostgreSQL error codes to user-friendly messages
  if (error?.code === '23505') {
    return 'Este registro já existe no sistema';
  }
  
  if (error?.code === '23503') {
    return 'Operação não permitida - existem dados relacionados';
  }
  
  if (error?.code === '42501') {
    return 'Você não tem permissão para realizar esta operação';
  }
  
  if (error?.code === 'PGRST116') {
    return 'Registro não encontrado';
  }
  
  // Generic fallback - never expose internal error messages
  return 'Ocorreu um erro. Tente novamente ou contate o suporte.';
};
