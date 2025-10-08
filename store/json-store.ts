import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveJsonData, getLastJsonData } from '@/lib/indexeddb';

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
  view: 'tree' | 'table' | 'raw' | 'diff' | 'query' | 'schema' | 'diagram' | 'graph' | 'visualize' | 'transform' | 'api' | 'profiler';
  isLoading: boolean;
  error: JsonError | null;
  
  // Search and filter
  searchQuery: string;
  filterPath: string;
  
  // Autosave state
  lastSaved: number | null;
  hasUnsavedChanges: boolean;
  
  // User intent state
  userClearedData: boolean;
  
  // Actions
  setJsonData: (data: JsonValue, raw: string, fileName?: string) => void;
  setView: (view: 'tree' | 'table' | 'raw' | 'diff' | 'query' | 'schema' | 'diagram' | 'graph' | 'visualize' | 'transform' | 'api' | 'profiler') => void;
  setSearchQuery: (query: string) => void;
  setFilterPath: (path: string) => void;
  clearData: () => void;
  setError: (error: JsonError | null) => void;
  setLoading: (loading: boolean) => void;
  loadFromIndexedDB: () => Promise<void>;
  markAsSaved: () => void;
  markAsChanged: () => void;
  setUserClearedData: (cleared: boolean) => void;
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
      lastSaved: null,
      hasUnsavedChanges: false,
      userClearedData: false,

      // Actions
      setJsonData: (data, raw, fileName) => {
        const fileSize = new Blob([raw]).size;
        set({
          jsonData: data,
          rawJson: raw,
          fileName: fileName || null,
          fileSize,
          error: null,
          hasUnsavedChanges: true,
          userClearedData: false,
        });
        
        // Save to IndexedDB asynchronously
        if (typeof window !== 'undefined') {
          saveJsonData({
            id: 'last-loaded',
            jsonData: data,
            rawJson: raw,
            fileName: fileName || null,
            fileSize,
            timestamp: Date.now(),
          }).then(() => {
            set({ lastSaved: Date.now(), hasUnsavedChanges: false });
          }).catch((error) => {
            console.error('Failed to save to IndexedDB:', error);
          });
        }
      },

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
          userClearedData: true,
        }),

      setError: (error) => set({ error, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),
      
      loadFromIndexedDB: async () => {
        if (typeof window === 'undefined') return;
        
        try {
          const lastData = await getLastJsonData();
          if (lastData) {
            set({
              jsonData: lastData.jsonData as JsonValue,
              rawJson: lastData.rawJson,
              fileName: lastData.fileName,
              fileSize: lastData.fileSize,
              error: null,
              hasUnsavedChanges: false,
              lastSaved: lastData.timestamp,
            });
          }
        } catch (error) {
          console.error('Failed to load from IndexedDB:', error);
        }
      },

      markAsSaved: () => set({ 
        lastSaved: Date.now(), 
        hasUnsavedChanges: false 
      }),

      markAsChanged: () => set({ hasUnsavedChanges: true }),

      setUserClearedData: (userClearedData) => set({ userClearedData }),
    }),
    {
      name: 'jsonlens-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist only lightweight UI state to avoid heavy localStorage writes
      partialize: (state) => ({
        fileName: state.fileName,
        fileSize: state.fileSize,
        view: state.view,
      }),
    }
  )
);
