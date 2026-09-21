import { NativeModules, Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';

const { NativeDownloadManager } = NativeModules;

/**
 * Downloads a purchased design ZIP natively on Android.
 * - Uses Android's system DownloadManager so the file is saved directly to Downloads/
 * - Includes Authorization Bearer header so the server authorizes the request
 * - Displays Android system notification (Downloading... / Download complete)
 * - Keeps user inside the native mobile app without opening any browser
 *
 * @param {Object} purchase - Purchase item object
 * @param {string} authToken - Active user JWT token
 * @returns {Promise<boolean>} - Whether download was successfully enqueued
 */
export const downloadPurchasedZip = async (purchase, authToken) => {
  try {
    const token = authToken || (await AsyncStorage.getItem('token'));
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to download your purchased files.');
      return false;
    }

    const purchaseId = purchase._id || purchase.id;
    if (!purchaseId) {
      Alert.alert('Download Error', 'Invalid purchase record.');
      return false;
    }

    const rawTitle = purchase.design_title || purchase.title || 'design';
    const safeTitle = rawTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'embroidery_design';
    const fileName = `${safeTitle}.zip`;
    const downloadUrl = `${BASE_URL}/payment/download/${purchaseId}?token=${encodeURIComponent(token)}`;

    // If native Android DownloadManager module is available, use it directly
    if (Platform.OS === 'android' && NativeDownloadManager?.downloadFile) {
      try {
        await NativeDownloadManager.downloadFile(
          downloadUrl,
          fileName,
          token,
          rawTitle
        );
        Alert.alert(
          'Download Started',
          `"${fileName}" is downloading. Check your notification bar and Downloads folder.`
        );
        return true;
      } catch (nativeErr) {
        console.warn('NativeDownloadManager failed, falling back to Linking:', nativeErr);
      }
    }

    // Fallback if native module not ready
    const canOpen = await Linking.canOpenURL(downloadUrl);
    if (canOpen) {
      await Linking.openURL(downloadUrl);
      return true;
    } else {
      Alert.alert('Download Error', 'Could not initiate file download on this device.');
      return false;
    }
  } catch (err) {
    console.error('Download exception:', err);
    Alert.alert('Download Failed', err?.message || 'Unable to download file.');
    return false;
  }
};
