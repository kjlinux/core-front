export function required(value: unknown): true | string {
  if (value === null || value === undefined || value === '') {
    return 'Ce champ est requis'
  }
  if (Array.isArray(value) && value.length === 0) {
    return 'Ce champ est requis'
  }
  return true
}

export function email(value: string): true | string {
  if (!value) return true
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(value) || 'Adresse email invalide'
}

export function minLength(min: number): (value: string) => true | string {
  return (value: string) => {
    if (!value) return true
    return value.length >= min || `Minimum ${min} caracteres requis`
  }
}

export function maxLength(max: number): (value: string) => true | string {
  return (value: string) => {
    if (!value) return true
    return value.length <= max || `Maximum ${max} caracteres autorises`
  }
}

export function phone(value: string): true | string {
  if (!value) return true
  const pattern = /^\+?[0-9\s\-()]{8,20}$/
  return pattern.test(value) || 'Numero de telephone invalide'
}

export function rfidUid(value: string): true | string {
  if (!value) return true
  const pattern = /^[0-9A-Fa-f]{8,20}$/
  return pattern.test(value) || 'UID RFID invalide (8 a 20 caracteres hexadecimaux)'
}
