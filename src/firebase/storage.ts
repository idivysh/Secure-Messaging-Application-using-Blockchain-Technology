// src/firebase/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

export async function uploadAvatar(uri: string, uid: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const avatarRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(avatarRef, blob);

  return await getDownloadURL(avatarRef);
}
