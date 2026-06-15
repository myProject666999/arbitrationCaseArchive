export interface DesensitizationRules {
  name?: boolean;
  idCard?: boolean;
  phone?: boolean;
  email?: boolean;
  address?: boolean;
  bankCard?: boolean;
}

export interface DesensitizationResult {
  text: string;
  count: number;
  rules: DesensitizationRules;
}

const patterns: Record<keyof DesensitizationRules, RegExp> = {
  name: /([\u4e00-\u9fa5]{2,4})(?=[，。；：\s]|$)/g,
  idCard: /\d{17}[\dXx]|\d{15}/g,
  phone: /1[3-9]\d{9}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  address: /([\u4e00-\u9fa5]{2,}(省|市|区|县|街道|路|号|小区|号楼|单元|室))[\u4e00-\u9fa5\d]*/g,
  bankCard: /\d{16,19}/g,
};

const replacements: Record<keyof DesensitizationRules, (match: string) => string> = {
  name: (match) => match.charAt(0) + '*'.repeat(Math.max(0, match.length - 1)),
  idCard: (match) => match.substring(0, 6) + '*'.repeat(match.length - 10) + match.substring(match.length - 4),
  phone: (match) => match.substring(0, 3) + '****' + match.substring(7),
  email: (match) => {
    const [name, domain] = match.split('@');
    return name.charAt(0) + '*'.repeat(Math.max(0, name.length - 1)) + '@' + domain;
  },
  address: (match) => {
    if (match.length <= 6) return match;
    return match.substring(0, 3) + '*'.repeat(Math.min(6, match.length - 3)) + (match.length > 9 ? match.substring(match.length - 3) : '');
  },
  bankCard: (match) => match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4),
};

export function desensitize(text: string, rules: DesensitizationRules): DesensitizationResult {
  let result = text;
  let count = 0;
  const appliedRules: DesensitizationRules = {};

  for (const [key, enabled] of Object.entries(rules)) {
    if (enabled && patterns[key as keyof DesensitizationRules]) {
      const pattern = patterns[key as keyof DesensitizationRules];
      const replacement = replacements[key as keyof DesensitizationRules];
      
      const matches = result.match(pattern);
      if (matches) {
        count += matches.length;
        result = result.replace(pattern, replacement);
      }
      appliedRules[key as keyof DesensitizationRules] = true;
    }
  }

  return {
    text: result,
    count,
    rules: appliedRules,
  };
}

export function getDefaultRules(): DesensitizationRules {
  return {
    name: true,
    idCard: true,
    phone: true,
    email: true,
    address: false,
    bankCard: false,
  };
}
