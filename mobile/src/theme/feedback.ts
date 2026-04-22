import {Alert} from 'react-native';

type AlertAction = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export const feedback = {
  alert(title: string, message: string) {
    Alert.alert(title, message);
  },
  success(message: string, title = 'Exito') {
    Alert.alert(title, message);
  },
  error(message: string, title = 'Error') {
    Alert.alert(title, message);
  },
  info(message: string, title = 'Info') {
    Alert.alert(title, message);
  },
  confirm(title: string, message: string, actions: AlertAction[]) {
    Alert.alert(title, message, actions);
  },
};
