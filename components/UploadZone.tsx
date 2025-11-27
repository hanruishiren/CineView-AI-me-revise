import React, { useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';
import { Language } from '../types';
import { t } from '../utils/translations';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  language: Language;
  onUploadClick?: () => boolean;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, language, onUploadClick }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateAndSelect = useCallback((file: File) => {
    // File Size Check
    if (file.size > MAX_FILE_SIZE) {
      alert(`${t('errorFileTooLarge', language)}\n${t('limitSuggestion', language)}`);
      return;
    }
    onFileSelect(file);
  }, [onFileSelect, language]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Key Check for Drop
    if (onUploadClick) {
      const canProceed = onUploadClick();
      if (!canProceed) return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        validateAndSelect(file);
      } else {
        alert(t('uploadError', language));
      }
    }
  }, [validateAndSelect, language, onUploadClick]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
    // Reset to allow selecting the same file again
    e.target.value = '';
  }, [validateAndSelect]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onUploadClick) {
      const canProceed = onUploadClick();
      if (!canProceed) return;
    }
    inputRef.current?.click();
  }, [onUploadClick]);

  return (
    <div className="flex flex-col items-center justify-center w-full animate-fade-in">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-row items-center justify-center gap-6 w-full max-w-[480px] py-8 px-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-[24px] cursor-pointer bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#28292a] hover:border-gray-900 dark:hover:border-gray-400 transition-all duration-300 group shadow-sm dark:shadow-none"
      >
        {/* Updated Icon Container to match Card Style */}
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-900 dark:text-white transition-transform duration-300 group-hover:scale-110 shrink-0 backdrop-blur-sm">
          <UploadIcon className="w-7 h-7" />
        </div>

        <div className="flex flex-col text-left">
          <p className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
            {t('uploadVideoFile', language)}
          </p>
          <div className="flex flex-col mt-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('supportedFormats', language)}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default UploadZone;