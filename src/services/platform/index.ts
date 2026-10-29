import { FileOperationsPlatform } from '../../types';
import { WebFilePlatform } from './WebFilePlatform';
import { TauriFilePlatform } from './TauriFilePlatform';

let platformInstance: FileOperationsPlatform | null = null;

export const getPlatform = (): FileOperationsPlatform => {
  if (platformInstance) return platformInstance;

  const isTauri = typeof window !== 'undefined' && ('__TAURI_IPC__' in window || '__TAURI__' in window);
  if (isTauri) {
    platformInstance = new TauriFilePlatform();
  } else {
    platformInstance = new WebFilePlatform();
  }

  return platformInstance;
};

export { WebFilePlatform, TauriFilePlatform };
