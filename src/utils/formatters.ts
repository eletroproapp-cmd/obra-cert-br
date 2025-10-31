/**
 * Formata um número de telefone brasileiro com DDD entre parênteses
 * Aceita: 11999998888, 1199999-8888, (11) 99999-8888, etc.
 * Retorna: (11) 99999-8888 ou (11) 9999-8888
 */
export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se tiver menos de 2 dígitos, retorna como está
  if (numbers.length < 2) return numbers;
  
  // Se tiver 2-10 dígitos, formata (XX) XXXX-XXXX ou parcialmente
  if (numbers.length <= 10) {
    const ddd = numbers.slice(0, 2);
    const part1 = numbers.slice(2, 6);
    const part2 = numbers.slice(6, 10);
    
    let formatted = `(${ddd})`;
    if (part1) formatted += ` ${part1}`;
    if (part2) formatted += `-${part2}`;
    
    return formatted;
  }
  
  // Se tiver 11 dígitos, formata (XX) XXXXX-XXXX (celular com 9)
  const ddd = numbers.slice(0, 2);
  const part1 = numbers.slice(2, 7);
  const part2 = numbers.slice(7, 11);
  
  return `(${ddd}) ${part1}-${part2}`;
};

/**
 * Remove a formatação do telefone, deixando apenas os números
 */
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};
