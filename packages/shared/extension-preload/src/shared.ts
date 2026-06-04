export const checkLength = (str: unknown, length = 1048576) => {
  if (typeof str == 'string' && str.length > length) throw new Error('Input too long')
  return str
}
