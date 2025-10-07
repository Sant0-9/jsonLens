import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
}

export interface JsonState {
  // Data state
  jsonData: JsonValue | null;
  rawJson: string;
  fileName: string | null;
  fileSize: number;
  
  // UI state
  view: 'tree' | 'table' | 'raw';
  isLoading: boolean;
  error: JsonError | null;
  
  // Search and filter
  searchQuery: string;
  filterPath: string;
  
  // Actions
  setJsonData: (data: JsonValue, raw: string, fileName?: string) => void;
  setView: (view: 'tree' | 'table' | 'raw') => void;
  setSearchQuery: (query: string) => void;
  setFilterPath: (path: string) => void;
  clearData: () => void;
  setError: (error: JsonError | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useJsonStore = create<JsonState>()(
  persist(
    (set) => ({
      // Initial state
      jsonData: null,
      rawJson: '',
      fileName: null,
      fileSize: 0,
      view: 'tree',
      isLoading: false,
      error: null,
      searchQuery: '',
      filterPath: '',

      // Actions
      setJsonData: (data, raw, fileName) =>
        set({
          jsonData: data,
          rawJson: raw,
          fileName: fileName || null,
          fileSize: new Blob([raw]).size,
          error: null,
        }),

      setView: (view) => set({ view }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setFilterPath: (filterPath) => set({ filterPath }),

      clearData: () =>
        set({
          jsonData: null,
          rawJson: '',
          fileName: null,
          fileSize: 0,
          error: null,
          searchQuery: '',
          filterPath: '',
        }),

      setError: (error) => set({ error, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'jsonlens-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jsonData: state.jsonData,
        rawJson: state.rawJson,
        fileName: state.fileName,
        fileSize: state.fileSize,
        view: state.view,
      }),
    }
  )
);
