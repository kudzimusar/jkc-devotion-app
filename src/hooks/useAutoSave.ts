"use client";
import { useEffect, useRef, useCallback } from 'react';
import { saveFormData, loadFormData, clearFormData } from '@/lib/form-storage';

interface UseAutoSaveOptions {
  formType: string;
  data: any;
  enabled?: boolean;
  debounceMs?: number;
  onRestore?: (data: any) => void;
  onSave?: () => void;
}

export const useAutoSave = ({
  formType,
  data,
  enabled = true,
  debounceMs = 1000,
  onRestore,
  onSave
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const isFirstRender = useRef(true);

  // Save on data change with debounce
  useEffect(() => {
    if (!enabled) return;
    
    // Don't save on first render if we're restoring
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveFormData(formType, data);
      onSave?.();
    }, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, formType, enabled, debounceMs, onSave]);

  // Check for saved data on mount
  useEffect(() => {
    if (!enabled) return;
    
    const saved = loadFormData(formType);
    if (saved && saved.data && Object.keys(saved.data).length > 0) {
      onRestore?.(saved.data);
    }
  }, [formType, enabled, onRestore]);

  const clearSaved = useCallback(() => {
    clearFormData(formType);
  }, [formType]);

  return { clearSaved };
};
