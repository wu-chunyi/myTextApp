import { Platform } from 'react-native';

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * 获取文件大小
 */
export const getFileSize = async (uri: string): Promise<number> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return 0;
  }
};

/**
 * Native 端图片压缩（expo-image-manipulator）
 */
export const compressImageNative = async (
  uri: string,
  fileSize: number
): Promise<string> => {
  const originalSizeMB = fileSize / (1024 * 1024);
  if (originalSizeMB < 3) return uri;
  if (originalSizeMB > 15) throw new Error('图片超过15MB');

  const ImageManipulator = await import('expo-image-manipulator');

  let quality: number;
  if (originalSizeMB >= 8) {
    quality = 0.3;
  } else if (originalSizeMB >= 6) {
    quality = 0.4;
  } else {
    quality = 0.5;
  }

  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const finalSize = await getFileSize(result.uri);
  if (finalSize > MAX_IMAGE_SIZE) {
    throw new Error('压缩后图片仍大于4MB');
  }
  return result.uri;
};

/**
 * 通用图片压缩
 */
export const compressImage = async (
  uri: string,
  fileSize: number
): Promise<string> => {
  if (Platform.OS === 'web') {
    // Web 端可以用 browser-image-compression，暂时直接返回
    // TODO: 实现 Web 端压缩
    return uri;
  }
  return compressImageNative(uri, fileSize);
};
