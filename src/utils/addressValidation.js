/**
 * Validation utilities for address fields
 */

// Validate phone number (Vietnamese format)
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return {
      valid: false,
      error: 'Số điện thoại không được để trống'
    }
  }

  const trimmed = phone.trim()
  
  // Remove spaces and dashes
  const cleaned = trimmed.replace(/[\s\-]/g, '')
  
  // Vietnam phone regex: starts with 0, followed by 9 digits or valid mobile/landline patterns
  const vietnamPhoneRegex = /^(0|\+84)[0-9]{9,10}$/
  
  if (!vietnamPhoneRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'Số điện thoại không hợp lệ (ví dụ: 0123456789)'
    }
  }

  return { valid: true }
}

// Validate unit number (số nhà)
export const validateUnitNumber = (value) => {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Số nhà không được để trống'
    }
  }

  const trimmed = value.trim()
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Số nhà không được để trống'
    }
  }
  
  if (trimmed.length > 20) {
    return {
      valid: false,
      error: 'Số nhà không được vượt quá 20 ký tự'
    }
  }
  
  // Allow numbers, letters, and common characters like '-', '/', 'A', 'B', etc.
  const validCharRegex = /^[0-9A-Za-zÀ-ỿ\s\/\-\.]+$/
  
  if (!validCharRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Số nhà chỉ được chứa chữ số, chữ cái và ký tự phổ biến (-/. )'
    }
  }
  
  return { valid: true }
}

// Validate street number (số đường)
export const validateStreetNumber = (value) => {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Số đường không được để trống'
    }
  }

  const trimmed = value.trim()
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Số đường không được để trống'
    }
  }
  
  if (trimmed.length > 20) {
    return {
      valid: false,
      error: 'Số đường không được vượt quá 20 ký tự'
    }
  }
  
  // Allow numbers and common characters
  const validCharRegex = /^[0-9\/\-\.]+$/
  
  if (!validCharRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Số đường chỉ được chứa chữ số và ký tự (-/. )'
    }
  }
  
  return { valid: true }
}

// Validate street name (tên đường)
export const validateAddressLine1 = (value) => {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'Tên đường không được để trống'
    }
  }

  const trimmed = value.trim()
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Tên đường không được để trống'
    }
  }
  
  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Tên đường không được vượt quá 100 ký tự'
    }
  }
  
  // Allow letters, numbers, spaces, and common characters
  const validCharRegex = /^[0-9A-Za-zÀ-ỿ\s\-\.,']+$/
  
  if (!validCharRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Tên đường chứa ký tự không được phép'
    }
  }
  
  return { valid: true }
}

// Validate postal code (mã bưu chính) - optional, but if provided must be valid
export const validatePostalCode = (value) => {
  // If empty, it's optional - so valid
  if (!value || String(value).trim().length === 0) {
    return { valid: true }
  }

  const trimmed = String(value).trim()
  
  if (trimmed.length > 10) {
    return {
      valid: false,
      error: 'Mã bưu chính không được vượt quá 10 ký tự'
    }
  }
  
  // Should be alphanumeric
  const validCharRegex = /^[0-9A-Za-z\-\s]+$/
  
  if (!validCharRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Mã bưu chính chỉ được chứa chữ số, chữ cái và dấu gạch ngang'
    }
  }
  
  return { valid: true }
}

// Validate required address fields
export const validateRequiredAddressFields = (province, district, ward) => {
  if (!province) {
    return {
      valid: false,
      error: 'Tỉnh / Thành phố không được để trống'
    }
  }
  
  if (!district) {
    return {
      valid: false,
      error: 'Quận / Huyện không được để trống'
    }
  }
  
  if (!ward) {
    return {
      valid: false,
      error: 'Phường / Xã không được để trống'
    }
  }
  
  return { valid: true }
}

// Comprehensive address validation for new address
export const validateNewAddress = (addressData, selectDropdowns = {}) => {
  const { unitNumber, streetNumber, addressLine1, postalCode } = addressData
  const { province, district, ward } = selectDropdowns
  
  const errors = {}
  
  // Validate unit number
  const unitResult = validateUnitNumber(unitNumber)
  if (!unitResult.valid) errors.unitNumber = unitResult.error
  
  // Validate street number
  const streetResult = validateStreetNumber(streetNumber)
  if (!streetResult.valid) errors.streetNumber = streetResult.error
  
  // Validate address line 1
  const addressLine1Result = validateAddressLine1(addressLine1)
  if (!addressLine1Result.valid) errors.addressLine1 = addressLine1Result.error
  
  // Validate required dropdowns
  const requiredResult = validateRequiredAddressFields(province, district, ward)
  if (!requiredResult.valid) errors.dropdowns = requiredResult.error
  
  // Validate postal code (optional)
  const postalResult = validatePostalCode(postalCode)
  if (!postalResult.valid) errors.postalCode = postalResult.error
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Comprehensive address validation for account settings
export const validateAccountAddress = (addressData, selectDropdowns = {}) => {
  const { phoneNumber, unitNumber, streetNumber, addressLine1, postalCode } = addressData
  const { province, district, ward } = selectDropdowns
  
  const errors = {}
  
  // Validate phone number
  const phoneResult = validatePhoneNumber(phoneNumber)
  if (!phoneResult.valid) errors.phoneNumber = phoneResult.error
  
  // Validate unit number
  const unitResult = validateUnitNumber(unitNumber)
  if (!unitResult.valid) errors.unitNumber = unitResult.error
  
  // Validate street number
  const streetResult = validateStreetNumber(streetNumber)
  if (!streetResult.valid) errors.streetNumber = streetResult.error
  
  // Validate address line 1
  const addressLine1Result = validateAddressLine1(addressLine1)
  if (!addressLine1Result.valid) errors.addressLine1 = addressLine1Result.error
  
  // Validate required dropdowns
  const requiredResult = validateRequiredAddressFields(province, district, ward)
  if (!requiredResult.valid) errors.dropdowns = requiredResult.error
  
  // Validate postal code (optional)
  const postalResult = validatePostalCode(postalCode)
  if (!postalResult.valid) errors.postalCode = postalResult.error
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Get first error message for display
export const getFirstErrorMessage = (errors) => {
  const errorMessages = [
    errors.phoneNumber,
    errors.unitNumber,
    errors.streetNumber,
    errors.addressLine1,
    errors.dropdowns,
    errors.postalCode
  ]
  
  return errorMessages.find(msg => msg) || 'Thông tin địa chỉ không hợp lệ'
}
