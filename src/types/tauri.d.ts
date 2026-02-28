declare namespace TauriAPI {
  export interface FileFilter {
    name: string;
    extensions: string[];
  }

  export interface DialogOptions {
    multiple?: boolean;
    filters?: FileFilter[];
    defaultPath?: string;
  }

  export function open(options: DialogOptions): Promise<string | null>;
  export function save(options: TauriFileOptions): Promise<void>;
}

export namespace TauriFS {
  export function writeTextFile(
    filePath: string,
    contents: string,
    options?: TauriFileOptions
  ): Promise<void>;
  export function readTextFile(filePath: string, options?: TauriFileOptions): Promise<string>;
}

interface TauriFileOptions {
  dir?: string;
}
