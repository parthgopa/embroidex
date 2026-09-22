import { NativeModules, Platform, Alert } from 'react-native';

const { NativeFilePicker } = NativeModules;

/**
 * Pick front/main photo for embroidery design.
 * @returns {Promise<Object|null>} { uri, name, type, size, base64 }
 */
export const pickMainPhoto = async () => {
  if (Platform.OS !== 'android' || !NativeFilePicker?.pickImage) {
    Alert.alert('Unsupported', 'Photo picking is supported natively on Android.');
    return null;
  }

  try {
    const results = await NativeFilePicker.pickImage(false);
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (err) {
    console.warn('pickMainPhoto error:', err);
    Alert.alert('Photo Selection Failed', err?.message || 'Could not select photo.');
    return null;
  }
};

/**
 * Pick up to remaining allowed additional detail photos.
 * @param {number} alreadySelectedCount - How many additional photos are already chosen
 * @returns {Promise<Array>} Array of { uri, name, type, size, base64 }
 */
export const pickAdditionalPhotos = async (alreadySelectedCount = 0) => {
  const currentCount = Number(alreadySelectedCount) || 0;
  const maxAllowed = 5 - currentCount;

  if (maxAllowed <= 0) {
    Alert.alert('Limit Reached', 'You can upload a maximum of 5 additional detail photos.');
    return [];
  }

  if (Platform.OS !== 'android' || !NativeFilePicker?.pickImage) {
    Alert.alert('Unsupported', 'Photo picking is supported natively on Android.');
    return [];
  }

  try {
    const results = await NativeFilePicker.pickImage(true);
    if (results && results.length > 0) {
      return results.slice(0, maxAllowed);
    }
    return [];
  } catch (err) {
    console.warn('pickAdditionalPhotos error:', err);
    Alert.alert('Photo Selection Failed', err?.message || 'Could not select photos.');
    return [];
  }
};

/**
 * Pick design machine/ZIP file (.zip, .emb, .dst, etc.).
 * @returns {Promise<Object|null>} { uri, name, type, size }
 */
export const pickDesignFile = async () => {
  if (Platform.OS !== 'android' || !NativeFilePicker?.pickDocument) {
    Alert.alert('Unsupported', 'File picking is supported natively on Android.');
    return null;
  }

  try {
    const results = await NativeFilePicker.pickDocument();
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (err) {
    console.warn('pickDesignFile error:', err);
    Alert.alert('File Selection Failed', err?.message || 'Could not select design file.');
    return null;
  }
};
