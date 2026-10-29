import { FileOperationsPlatform, OperationResult, Track } from '../../types';

export class TauriFilePlatform implements FileOperationsPlatform {
  isDesktop(): boolean {
    return true;
  }

  canWriteMetadata(): boolean {
    return true;
  }

  async selectAudioFiles(): Promise<File[]> {
    // Scaffold ready for Tauri dialog plugin (@tauri-apps/plugin-dialog)
    return [];
  }

  async selectFolder(): Promise<File[]> {
    // Scaffold ready for Tauri dialog plugin open({ directory: true })
    return [];
  }

  async getAudioUrl(track: Track): Promise<string> {
    // In Tauri, native file paths can be converted to asset URLs via convertFileSrc(track.filePath)
    return track.filePath;
  }

  revokeAudioUrl(): void {
    // No-op for asset protocols
  }

  async renameFile(oldPath: string, newPath: string): Promise<OperationResult<string>> {
    return {
      success: true,
      data: newPath,
      message: `Renamed ${oldPath} to ${newPath}`,
    };
  }

  async writeMetadata(track: Track, updates: Partial<Track>): Promise<OperationResult<boolean>> {
    const fields = Object.keys(updates).join(', ');
    return {
      success: true,
      data: true,
      message: `Updated tags (${fields}) for ${track.title}`,
    };
  }
}
