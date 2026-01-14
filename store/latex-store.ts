"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LatexProject, ProjectFile } from '@/lib/db/schema'
import {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  addFileToProject,
  updateFileInProject,
  deleteFileFromProject,
  renameFileInProject,
  setMainFile as setMainFileInProject,
  duplicateProject,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_MAIN_TEX
} from '@/lib/latex/project-manager'

export type LatexView = 'split' | 'editor' | 'preview' | 'pdf'

export interface LatexFile {
  name: string
  content: string
  isMain: boolean
}

export interface CompilationResult {
  success: boolean
  pdf: Uint8Array | null
  log: string[]
  errors: string[]
  warnings: string[]
}

// SyncTeX navigation state
export interface SyncTeXNavigation {
  // Source to PDF: when user clicks in editor, highlight PDF location
  highlightPDF: {
    page: number
    x: number
    y: number
    width: number
    height: number
  } | null

  // PDF to Source: when user clicks in PDF, navigate to source line
  navigateToSource: {
    file: string
    line: number
    column: number
  } | null
}

interface LatexState {
  // Project management
  currentProjectId: string | null
  currentProject: LatexProject | null
  projects: LatexProject[]
  isLoadingProjects: boolean

  // Document
  content: string
  fileName: string

  // Multi-file project (legacy support)
  files: LatexFile[]
  activeFile: string

  // Compilation
  compiledPDF: Uint8Array | null
  compilationLog: string[]
  compilationErrors: string[]
  compilationWarnings: string[]
  isCompiling: boolean
  compilationError: string | null
  lastCompiled: number | null

  // UI State
  view: LatexView
  showSymbolPalette: boolean
  showTemplates: boolean
  showBibliography: boolean
  showFileTree: boolean
  showProjectSelector: boolean
  editorFontSize: number

  // SyncTeX state
  syncTeXNavigation: SyncTeXNavigation

  // Project actions
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createNewProject: (name: string, content?: string) => Promise<LatexProject>
  saveCurrentProject: () => Promise<void>
  deleteCurrentProject: () => Promise<void>
  duplicateCurrentProject: (newName?: string) => Promise<LatexProject | null>

  // File actions (project-based)
  addProjectFile: (fileName: string, content?: string) => Promise<void>
  updateProjectFile: (fileId: string, content: string) => Promise<void>
  deleteProjectFile: (fileId: string) => Promise<void>
  renameProjectFile: (fileId: string, newName: string) => Promise<void>
  setProjectMainFile: (fileName: string) => Promise<void>

  // Content actions
  setContent: (content: string) => void
  setFileName: (fileName: string) => void
  setView: (view: LatexView) => void
  setActiveFile: (fileName: string) => void

  // Legacy file management (for non-project mode)
  addFile: (file: LatexFile) => void
  updateFile: (fileName: string, content: string) => void
  deleteFile: (fileName: string) => void
  setMainFile: (fileName: string) => void

  // Compilation
  setCompiling: (isCompiling: boolean) => void
  setCompilationResult: (result: CompilationResult) => void
  clearCompilation: () => void

  // UI toggles
  toggleSymbolPalette: () => void
  toggleTemplates: () => void
  toggleBibliography: () => void
  toggleFileTree: () => void
  toggleProjectSelector: () => void
  setEditorFontSize: (size: number) => void

  // SyncTeX actions
  highlightPDFLocation: (location: SyncTeXNavigation['highlightPDF']) => void
  navigateToSourceLocation: (location: SyncTeXNavigation['navigateToSource']) => void
  clearSyncTeXNavigation: () => void

  // Reset
  resetEditor: () => void
}

const DEFAULT_CONTENT = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}

\\title{My Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Welcome to the LaTeX editor! Start typing your document here.

\\subsection{Math Example}

Here's an example equation:

\\begin{equation}
E = mc^2
\\end{equation}

And an inline equation: $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$

\\section{Conclusion}

Happy writing!

\\end{document}
`

const initialState = {
  currentProjectId: null as string | null,
  currentProject: null as LatexProject | null,
  projects: [] as LatexProject[],
  isLoadingProjects: false,
  content: DEFAULT_CONTENT,
  fileName: 'document.tex',
  files: [{ name: 'document.tex', content: DEFAULT_CONTENT, isMain: true }] as LatexFile[],
  activeFile: 'document.tex',
  compiledPDF: null as Uint8Array | null,
  compilationLog: [] as string[],
  compilationErrors: [] as string[],
  compilationWarnings: [] as string[],
  isCompiling: false,
  compilationError: null as string | null,
  lastCompiled: null as number | null,
  view: 'split' as LatexView,
  showSymbolPalette: false,
  showTemplates: false,
  showBibliography: false,
  showFileTree: false,
  showProjectSelector: false,
  editorFontSize: 14,
  syncTeXNavigation: {
    highlightPDF: null,
    navigateToSource: null
  } as SyncTeXNavigation,
}

// Helper to convert ProjectFile to LatexFile
function projectFileToLatexFile(file: ProjectFile, mainFileName: string): LatexFile {
  return {
    name: file.name,
    content: file.content,
    isMain: file.name === mainFileName
  }
}

export const useLatexStore = create<LatexState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Project actions
      loadProjects: async () => {
        set({ isLoadingProjects: true })
        try {
          const projects = await getAllProjects()
          set({ projects, isLoadingProjects: false })
        } catch (error) {
          console.error('Failed to load projects:', error)
          set({ isLoadingProjects: false })
        }
      },

      loadProject: async (id: string) => {
        const project = await getProject(id)
        if (!project) return

        // Convert project files to LatexFile format
        const files = project.files.map(f =>
          projectFileToLatexFile(f, project.mainFile)
        )

        // Find main file or first tex file
        const mainFile = files.find(f => f.isMain) || files.find(f => f.name.endsWith('.tex'))
        const activeFile = mainFile?.name || files[0]?.name || 'main.tex'
        const content = mainFile?.content || files[0]?.content || DEFAULT_CONTENT

        set({
          currentProjectId: id,
          currentProject: project,
          files,
          activeFile,
          content,
          fileName: project.name,
          // Clear compilation on project switch
          compiledPDF: null,
          compilationLog: [],
          compilationErrors: [],
          compilationWarnings: [],
          compilationError: null
        })
      },

      createNewProject: async (name: string, content?: string) => {
        const project = await createProject(name, content || DEFAULT_MAIN_TEX)
        await get().loadProjects()
        await get().loadProject(project.id)
        return project
      },

      saveCurrentProject: async () => {
        const { currentProjectId, files } = get()
        if (!currentProjectId) return

        const projectFiles: Omit<ProjectFile, 'id'>[] = files.map(f => ({
          name: f.name,
          path: f.name,
          content: f.content,
          type: f.name.endsWith('.tex') ? 'tex' as const :
                f.name.endsWith('.bib') ? 'bib' as const :
                f.name.endsWith('.cls') ? 'cls' as const :
                f.name.endsWith('.sty') ? 'sty' as const :
                'other' as const,
          size: f.content.length
        }))

        // Get current project to preserve file IDs
        const currentProject = await getProject(currentProjectId)
        if (!currentProject) return

        // Map existing IDs or create new ones
        const updatedFiles: ProjectFile[] = projectFiles.map(f => {
          const existing = currentProject.files.find(ef => ef.name === f.name)
          return {
            ...f,
            id: existing?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        })

        await updateProject(currentProjectId, {
          files: updatedFiles,
          mainFile: files.find(f => f.isMain)?.name || 'main.tex'
        })

        const updated = await getProject(currentProjectId)
        if (updated) {
          set({ currentProject: updated })
        }
      },

      deleteCurrentProject: async () => {
        const { currentProjectId } = get()
        if (!currentProjectId) return

        await deleteProject(currentProjectId)
        set({
          currentProjectId: null,
          currentProject: null,
          content: DEFAULT_CONTENT,
          files: [{ name: 'document.tex', content: DEFAULT_CONTENT, isMain: true }],
          activeFile: 'document.tex'
        })
        await get().loadProjects()
      },

      duplicateCurrentProject: async (newName?: string) => {
        const { currentProjectId } = get()
        if (!currentProjectId) return null

        const duplicated = await duplicateProject(currentProjectId, newName)
        if (duplicated) {
          await get().loadProjects()
          await get().loadProject(duplicated.id)
        }
        return duplicated
      },

      // File actions (project-based)
      addProjectFile: async (fileName: string, content = '') => {
        const { currentProjectId } = get()
        if (!currentProjectId) {
          // If no project, use legacy mode
          get().addFile({ name: fileName, content, isMain: false })
          return
        }

        await addFileToProject(currentProjectId, fileName, content)
        await get().loadProject(currentProjectId)
      },

      updateProjectFile: async (fileId: string, content: string) => {
        const { currentProjectId, currentProject } = get()
        if (!currentProjectId || !currentProject) return

        await updateFileInProject(currentProjectId, fileId, { content })
        await get().loadProject(currentProjectId)
      },

      deleteProjectFile: async (fileId: string) => {
        const { currentProjectId } = get()
        if (!currentProjectId) return

        await deleteFileFromProject(currentProjectId, fileId)
        await get().loadProject(currentProjectId)
      },

      renameProjectFile: async (fileId: string, newName: string) => {
        const { currentProjectId } = get()
        if (!currentProjectId) return

        await renameFileInProject(currentProjectId, fileId, newName)
        await get().loadProject(currentProjectId)
      },

      setProjectMainFile: async (fileName: string) => {
        const { currentProjectId } = get()
        if (!currentProjectId) {
          // Legacy mode
          get().setMainFile(fileName)
          return
        }

        await setMainFileInProject(currentProjectId, fileName)
        await get().loadProject(currentProjectId)
      },

      // Content actions
      setContent: (content) => {
        const { activeFile, files, currentProjectId } = get()
        set({
          content,
          files: files.map(f =>
            f.name === activeFile ? { ...f, content } : f
          ),
        })

        // Auto-save to project if in project mode (debounced in component)
        if (currentProjectId) {
          // Note: actual save is triggered from component to debounce
        }
      },

      setFileName: (fileName) => set({ fileName }),

      setView: (view) => set({ view }),

      setActiveFile: (fileName) => {
        const file = get().files.find(f => f.name === fileName)
        if (file) {
          set({ activeFile: fileName, content: file.content })
        }
      },

      // Legacy file management
      addFile: (file) => {
        const { files } = get()
        if (!files.find(f => f.name === file.name)) {
          set({ files: [...files, file] })
        }
      },

      updateFile: (fileName, content) => {
        set({
          files: get().files.map(f =>
            f.name === fileName ? { ...f, content } : f
          ),
        })
      },

      deleteFile: (fileName) => {
        const { files, activeFile } = get()
        const newFiles = files.filter(f => f.name !== fileName)

        let newActiveFile = activeFile
        if (activeFile === fileName) {
          const mainFile = newFiles.find(f => f.isMain)
          newActiveFile = mainFile?.name || newFiles[0]?.name || ''
        }

        const newActiveContent = newFiles.find(f => f.name === newActiveFile)?.content || ''

        set({
          files: newFiles,
          activeFile: newActiveFile,
          content: newActiveContent,
        })
      },

      setMainFile: (fileName) => {
        set({
          files: get().files.map(f => ({
            ...f,
            isMain: f.name === fileName,
          })),
        })
      },

      // Compilation
      setCompiling: (isCompiling) => set({ isCompiling }),

      setCompilationResult: (result) => set({
        compiledPDF: result.pdf,
        compilationLog: result.log,
        compilationErrors: result.errors,
        compilationWarnings: result.warnings,
        compilationError: result.success ? null : 'Compilation failed',
        lastCompiled: Date.now(),
        isCompiling: false,
      }),

      clearCompilation: () => set({
        compiledPDF: null,
        compilationLog: [],
        compilationErrors: [],
        compilationWarnings: [],
        compilationError: null,
        lastCompiled: null,
      }),

      // UI toggles
      toggleSymbolPalette: () => set({ showSymbolPalette: !get().showSymbolPalette }),
      toggleTemplates: () => set({ showTemplates: !get().showTemplates }),
      toggleBibliography: () => set({ showBibliography: !get().showBibliography }),
      toggleFileTree: () => set({ showFileTree: !get().showFileTree }),
      toggleProjectSelector: () => set({ showProjectSelector: !get().showProjectSelector }),
      setEditorFontSize: (size) => set({ editorFontSize: size }),

      // SyncTeX actions
      highlightPDFLocation: (location) => set({
        syncTeXNavigation: {
          ...get().syncTeXNavigation,
          highlightPDF: location
        }
      }),

      navigateToSourceLocation: (location) => set({
        syncTeXNavigation: {
          ...get().syncTeXNavigation,
          navigateToSource: location
        }
      }),

      clearSyncTeXNavigation: () => set({
        syncTeXNavigation: {
          highlightPDF: null,
          navigateToSource: null
        }
      }),

      // Reset
      resetEditor: () => set(initialState),
    }),
    {
      name: 'jsonlens-latex-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        view: state.view,
        editorFontSize: state.editorFontSize,
        showFileTree: state.showFileTree,
        currentProjectId: state.currentProjectId,
        // Don't persist content/files - stored in IndexedDB
      }),
    }
  )
)
