declare namespace TauriAPI {
  export interface FileFilter {
    name: string;
    extensions: string[];
  }

  export function open(options: TauriAPI.DialogOptions): Promise<string | null>;
  export function save(options: TaurIFileOptions): Promise<void>;
}

export namespace TauriFS {
  export function writeTextFile(filePath: string, contents: string, options?: TauriIFileOptions): Promise<void>;
  export function readTextFile(filePath: string, options?: TauriIFileOptions): Promise<string>;
}

interface TauriIFileOptions {
  dir?: string;
}

interface TauriAPI.DialogOptions {
  multiple?: boolean;
  filters?: TauriAPI.FileFilter[];
  defaultPath?: string;
}
