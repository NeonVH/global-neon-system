export function validateUsername(value = "") {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9_]{3,18}$/.test(normalized)) {
    return {
      valid: false,
      message: "Username phải dài 3-18 ký tự, chỉ dùng chữ, số hoặc dấu gạch dưới."
    };
  }
  if (/admin|bot/i.test(normalized)) {
    return {
      valid: false,
      message: "Username không được chứa từ nhạy cảm như admin hoặc bot."
    };
  }
  return {
    valid: true,
    value: normalized
  };
}

export function validateEmail(value = "") {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return {
      valid: false,
      message: "Email chưa đúng định dạng."
    };
  }
  return {
    valid: true,
    value: normalized
  };
}

export function validatePassword(value = "") {
  if (value.length < 8) {
    return {
      valid: false,
      message: "Mật khẩu cần ít nhất 8 ký tự."
    };
  }
  return {
    valid: true,
    value
  };
}

export function validateText(value = "", maxLength = 5000) {
  const normalized = value.trim();
  if (!normalized) {
    return {
      valid: false,
      message: "Trường này không được để trống."
    };
  }
  if (normalized.length > maxLength) {
    return {
      valid: false,
      message: `Nội dung vượt quá ${maxLength} ký tự.`
    };
  }
  return {
    valid: true,
    value: normalized
  };
}

export function validateOptionalUrl(value = "") {
  const normalized = value.trim();
  if (!normalized) {
    return {
      valid: true,
      value: ""
    };
  }
  if (/^data:image\/[a-zA-Z+]+;base64,/.test(normalized)) {
    return {
      valid: true,
      value: normalized
    };
  }
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }
    return {
      valid: true,
      value: normalized
    };
  } catch {
    return {
      valid: false,
      message: "URL hoặc ảnh base64 chưa hợp lệ."
    };
  }
}

export function validateJson(value = "") {
  try {
    return {
      valid: true,
      value: JSON.parse(value)
    };
  } catch {
    return {
      valid: false,
      message: "JSON chưa hợp lệ."
    };
  }
}

export function validateFile(file, { maxSizeMb = 2, allowedTypes = ["image/jpeg", "image/png", "image/webp"] } = {}) {
  if (!file) {
    return {
      valid: false,
      message: "Chưa chọn file."
    };
  }
  const maxSize = maxSizeMb * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Định dạng file chưa được hỗ trợ."
    };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File vượt quá ${maxSizeMb}MB.`
    };
  }
  return {
    valid: true
  };
}
