// Universal form data persistence service
const STORAGE_PREFIX = 'churchos_form_';

export interface StoredFormData {
  data: any;
  formType: string;
  savedAt: string;
  expiresAt: string;
}

export const saveFormData = (formType: string, data: any): void => {
  try {
    const stored: StoredFormData = {
      data,
      formType,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
    };
    localStorage.setItem(`${STORAGE_PREFIX}${formType}`, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save form data:', e);
  }
};

export const loadFormData = (formType: string): StoredFormData | null => {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${formType}`);
    if (!saved) return null;
    
    const parsed: StoredFormData = JSON.parse(saved);
    
    // Check if expired (7 days)
    if (new Date(parsed.expiresAt) < new Date()) {
      clearFormData(formType);
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to load form data:', e);
    return null;
  }
};

export const clearFormData = (formType: string): void => {
  localStorage.removeItem(`${STORAGE_PREFIX}${formType}`);
};

export const getAllSavedForms = (): string[] => {
  const keys: string[] = [];
  if (typeof window === 'undefined') return keys;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ''));
    }
  }
  return keys;
};
