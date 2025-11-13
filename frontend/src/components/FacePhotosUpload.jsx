import React, { useState, useCallback } from 'react';
import { Upload, X, User, AlertCircle, CheckCircle, Camera } from 'lucide-react';

/**
 * FacePhotosUpload Component
 *
 * Allows uploading 3-5 face photos for client registration
 * Features:
 * - Drag & drop support
 * - File selection
 * - Preview with labels (Frontal, Left, Right, Additional)
 * - Validation (min 3, max 5 photos)
 * - Photo type indicators
 */
const FacePhotosUpload = ({ onChange, value = [], error }) => {
  const [photos, setPhotos] = useState(value);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Photo types in order
  const photoTypes = ['frontal', 'left', 'right', 'additional', 'additional'];
  const photoLabels = {
    frontal: 'Анфас (Прямо)',
    left: 'Влево',
    right: 'Вправо',
    additional: 'Дополнительно'
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      return 'Только JPEG и PNG изображения разрешены';
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'Размер файла не должен превышать 10MB';
    }

    return null;
  };

  const handleFiles = useCallback((files) => {
    setValidationError('');

    const newPhotos = [...photos];
    const remainingSlots = 5 - photos.length;

    if (files.length > remainingSlots) {
      setValidationError(`Можно добавить максимум ${remainingSlots} фото (всего до 5)`);
      return;
    }

    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        setValidationError(error);
        hasError = true;
        break;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      const photoIndex = newPhotos.length;
      const photoType = photoTypes[photoIndex];

      newPhotos.push({
        file,
        preview,
        type: photoType,
        name: file.name
      });
    }

    if (!hasError) {
      setPhotos(newPhotos);
      if (onChange) {
        onChange(newPhotos);
      }
    }
  }, [photos, onChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removePhoto = (index) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(photos[index].preview);

    const newPhotos = photos.filter((_, i) => i !== index);

    // Reassign photo types
    const updatedPhotos = newPhotos.map((photo, i) => ({
      ...photo,
      type: photoTypes[i]
    }));

    setPhotos(updatedPhotos);
    if (onChange) {
      onChange(updatedPhotos);
    }
    setValidationError('');
  };

  const isValid = photos.length >= 3 && photos.length <= 5;
  const canAddMore = photos.length < 5;

  return (
    <div className="space-y-4">
      {/* Header with validation status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Фотографии лица
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {photos.length >= 3 ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{photos.length}/5</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{photos.length}/3 минимум</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Требования:</strong> Загрузите от 3 до 5 фотографий лица клиента.
          Первые три фото должны быть: анфас, голова влево, голова вправо.
        </p>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="face-photos-input"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>

            <div>
              <label
                htmlFor="face-photos-input"
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Выберите файлы
              </label>
              <span className="text-gray-600 dark:text-gray-400"> или перетащите сюда</span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              PNG, JPEG до 10MB (осталось: {5 - photos.length})
            </p>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {(validationError || error) && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-gray-200 dark:border-gray-700"
            >
              {/* Photo Type Badge */}
              <div className="absolute top-2 left-2 z-10">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  photo.type === 'frontal'
                    ? 'bg-green-500 text-white'
                    : photo.type === 'left' || photo.type === 'right'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {photoLabels[photo.type]}
                </span>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 z-10 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить фото"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Photo Preview */}
              <div className="aspect-square relative">
                <img
                  src={photo.preview}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo Number */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white text-center font-medium">
                  Фото {index + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Summary */}
      {photos.length > 0 && (
        <div className={`flex items-center gap-2 text-sm ${
          isValid
            ? 'text-green-600 dark:text-green-400'
            : 'text-orange-600 dark:text-orange-400'
        }`}>
          {isValid ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Все фотографии загружены правильно</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Загрузите минимум {3 - photos.length} фото</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FacePhotosUpload;
