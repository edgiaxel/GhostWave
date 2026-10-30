import { FileOperationsPlatform, OperationResult, Track } from '../../types';
import { dbRepository } from '../storage/IndexedDbRepository';

export class WebFilePlatform implements FileOperationsPlatform {
  private activeObjectUrls = new Set<string>();
  private fileCache = new Map<string, File | Blob>();

  isDesktop(): boolean {
    return false;
  }

  canWriteMetadata(): boolean {
    return false;
  }

  storeFileInMemory(trackId: string, file: File | Blob): void {
    this.fileCache.set(trackId, file);
  }

  getFileFromMemory(trackId: string): File | Blob | undefined {
    return this.fileCache.get(trackId);
  }

  async selectAudioFiles(): Promise<File[]> {
    if (typeof window === 'undefined') return [];

    // Modern Web File System Access API
    if ('showOpenFilePicker' in window) {
      try {
        const handles = await (window as unknown as {
          showOpenFilePicker: (options: unknown) => Promise<FileSystemFileHandle[]>;
        }).showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'Audio Files',
              accept: {
                'audio/*': ['.mp3', '.flac', '.ogg', '.wav', '.m4a', '.aac', '.opus'],
              },
            },
          ],
        });

        const files: File[] = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          files.push(file);
        }
        return files;
      } catch (err: unknown) {
        // AbortError indicates user cancelled selection
        if (err instanceof Error && err.name === 'AbortError') {
          return [];
        }
        // Fall back to input element on permission issues
      }
    }

    // Classic HTML input fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.mp3,.flac,.ogg,.wav,.m4a,.aac,.opus,audio/*';
      input.style.display = 'none';

      input.onchange = () => {
        const files = input.files ? Array.from(input.files) : [];
        document.body.removeChild(input);
        resolve(files);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve([]);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  async selectFolder(): Promise<File[]> {
    if (typeof window === 'undefined') return [];

    // Directory Picker API
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as unknown as {
          showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
        }).showDirectoryPicker();

        const files: File[] = [];
        await this.readDirectoryRecursive(dirHandle, files);
        return files;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return [];
        }
      }
    }

    // webkitdirectory HTML input fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
      input.style.display = 'none';

      input.onchange = () => {
        const files = input.files ? Array.from(input.files) : [];
        document.body.removeChild(input);
        resolve(files);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve([]);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  private async readDirectoryRecursive(
    dirHandle: FileSystemDirectoryHandle,
    collectedFiles: File[]
  ): Promise<void> {
    for await (const entry of (dirHandle as unknown as AsyncIterable<FileSystemHandle>)) {
      if (entry.kind === 'file') {
        const fileHandle = entry as unknown as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        collectedFiles.push(file);
      } else if (entry.kind === 'directory') {
        const subDir = entry as unknown as FileSystemDirectoryHandle;
        await this.readDirectoryRecursive(subDir, collectedFiles);
      }
    }
  }

  async getAudioUrl(track: Track): Promise<string> {
    const cachedFile = this.fileCache.get(track.id);
    if (cachedFile) {
      const url = URL.createObjectURL(cachedFile);
      this.activeObjectUrls.add(url);
      return url;
    }

    try {
      const storedBlob = await dbRepository.getAudioBlob(track.id);
      if (storedBlob) {
        this.fileCache.set(track.id, storedBlob);
        const url = URL.createObjectURL(storedBlob);
        this.activeObjectUrls.add(url);
        return url;
      }
    } catch {
      // Fall through to path check
    }

    if (track.filePath && track.filePath.startsWith('blob:')) {
      return track.filePath;
    }

    return '';
  }

  revokeAudioUrl(url: string): void {
    if (this.activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeObjectUrls.delete(url);
    }
  }

  async renameFile(): Promise<OperationResult<string>> {
    return {
      success: false,
      error: 'In-place file renaming requires desktop filesystem access or native Tauri IPC.',
      code: 'UNSUPPORTED_PLATFORM',
    };
  }

  async writeMetadata(): Promise<OperationResult<boolean>> {
    return {
      success: false,
      error: 'In-place tag writing requires desktop filesystem access or native Tauri IPC.',
      code: 'UNSUPPORTED_PLATFORM',
    };
  }
}
