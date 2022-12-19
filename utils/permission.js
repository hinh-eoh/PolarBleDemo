import {
  check,
  request,
  RESULTS,
  openSettings,
  PERMISSIONS,
} from 'react-native-permissions';

import {Platform} from 'react-native';

const isAndroid = Platform.OS === 'android';

export const permitPermissionFunction = (keyPermission, callback) => {
  if (keyPermission) {
    check(keyPermission).then(result => {
      switch (result) {
        case RESULTS.DENIED:
        case RESULTS.LIMITED:
          request(keyPermission).then(res => callback(res));
          break;
        case RESULTS.UNAVAILABLE:
        case RESULTS.BLOCKED:
        case RESULTS.GRANTED:
          callback(result);
          break;
      }
    });
  }
};

export const keyPermission = {
  LOCATION: isAndroid
    ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
};
