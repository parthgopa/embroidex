import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const WEB_CLIENT_ID = '475491008850-sf8e4cl21h9tg5ja3aa0r2pcetbg63cg.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
};

export const promptGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Always clear cached Google credentials so Android prompts the Account Chooser dialog
    try {
      await GoogleSignin.signOut();
    } catch (_) {
      // Ignore if no previous session was cached
    }

    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return null;
    }

    if (response.type === 'success' && response.data) {
      const { user, idToken } = response.data;
      return {
        email: user.email,
        name: user.name || '',
        photo_url: user.photo || '',
        id_token: idToken || '',
      };
    }

    // Fallback for older versions or direct user object
    if (response.data?.user || response.user) {
      const u = response.data?.user || response.user;
      return {
        email: u.email,
        name: u.name || '',
        photo_url: u.photo || '',
        id_token: response.data?.idToken || response.idToken || '',
      };
    }

    return null;
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
};
