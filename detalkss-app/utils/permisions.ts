import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureMicPermission() {
    if (Platform.OS === 'android') {
        const ok = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return ok === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
}
