import * as SecureStore from 'expo-secure-store';

export async function saveSession() {
  await SecureStore.setItemAsync('session', 'true');
}

export async function hasSession() {
  return (await SecureStore.getItemAsync('session')) === 'true';
}

export async function clearSession() {
  await SecureStore.deleteItemAsync('session');
}
