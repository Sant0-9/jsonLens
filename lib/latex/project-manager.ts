/**
 * LaTeX Project Manager
 *
 * CRUD operations for LaTeX projects stored in IndexedDB.
 * Supports multi-file projects with templates.
 */

import { put, get, getAll, remove, generateId } from '@/lib/db'
import { STORES, type LatexProject, type ProjectFile, type ProjectSettings, type ProjectRecord } from '@/lib/db/schema'

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  engine: 'pdflatex',
  mainFile: 'main.tex',
  outputFormat: 'pdf',
  bibliography: 'none'
}

/**
 * Default main.tex content
 */
export const DEFAULT_MAIN_TEX = `\\documentclass{article}

\\title{Untitled Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Your content here.

\\end{document}
`

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  initialContent?: string,
  settings?: Partial<ProjectSettings>
): Promise<LatexProject> {
  const now = Date.now()
  const id = generateId()

  const mainFile: ProjectFile = {
    id: generateId(),
    name: 'main.tex',
    path: 'main.tex',
    content: initialContent || DEFAULT_MAIN_TEX,
    type: 'tex',
    size: (initialContent || DEFAULT_MAIN_TEX).length
  }

  const project: LatexProject = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    mainFile: 'main.tex',
    files: [mainFile],
    settings: {
      ...DEFAULT_PROJECT_SETTINGS,
      ...settings
    }
  }

  const record: ProjectRecord = {
    id,
    project,
    updatedAt: now
  }

  await put(STORES.PROJECTS, record)
  return project
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<LatexProject | null> {
  const record = await get<ProjectRecord>(STORES.PROJECTS, id)
  return record?.project || null
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<LatexProject[]> {
  const records = await getAll<ProjectRecord>(STORES.PROJECTS)
  return records
    .map(r => r.project)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<LatexProject, 'id' | 'createdAt'>>
): Promise<LatexProject | null> {
  const existing = await getProject(id)
  if (!existing) return null

  const now = Date.now()
  const updated: LatexProject = {
    ...existing,
    ...updates,
    updatedAt: now,
    settings: updates.settings
      ? { ...existing.settings, ...updates.settings }
      : existing.settings
  }

  const record: ProjectRecord = {
    id,
    project: updated,
    updatedAt: now
  }

  await put(STORES.PROJECTS, record)
  return updated
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    await remove(STORES.PROJECTS, id)
    return true
  } catch {
    return false
  }
}

/**
 * Add a file to a project
 */
export async function addFileToProject(
  projectId: string,
  fileName: string,
  content: string = '',
  type?: ProjectFile['type']
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  // Determine file type from extension if not provided
  const fileType = type || getFileType(fileName)

  const newFile: ProjectFile = {
    id: generateId(),
    name: fileName,
    path: fileName,
    content,
    type: fileType,
    size: content.length
  }

  // Check for duplicate
  if (project.files.some(f => f.name === fileName)) {
    throw new Error(`File "${fileName}" already exists in project`)
  }

  return updateProject(projectId, {
    files: [...project.files, newFile]
  })
}

/**
 * Update a file in a project
 */
export async function updateFileInProject(
  projectId: string,
  fileId: string,
  updates: Partial<Pick<ProjectFile, 'content' | 'name' | 'path'>>
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  const fileIndex = project.files.findIndex(f => f.id === fileId)
  if (fileIndex === -1) return null

  const updatedFile: ProjectFile = {
    ...project.files[fileIndex],
    ...updates,
    size: updates.content?.length ?? project.files[fileIndex].size
  }

  const updatedFiles = [...project.files]
  updatedFiles[fileIndex] = updatedFile

  return updateProject(projectId, { files: updatedFiles })
}

/**
 * Delete a file from a project
 */
export async function deleteFileFromProject(
  projectId: string,
  fileId: string
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  // Prevent deleting the last file
  if (project.files.length <= 1) {
    throw new Error('Cannot delete the last file in a project')
  }

  const fileToDelete = project.files.find(f => f.id === fileId)
  if (!fileToDelete) return null

  // If deleting main file, set a new main file
  let mainFile = project.mainFile
  if (fileToDelete.name === project.mainFile) {
    const remainingTexFiles = project.files
      .filter(f => f.id !== fileId && f.type === 'tex')
    if (remainingTexFiles.length > 0) {
      mainFile = remainingTexFiles[0].name
    }
  }

  return updateProject(projectId, {
    files: project.files.filter(f => f.id !== fileId),
    mainFile
  })
}

/**
 * Rename a file in a project
 */
export async function renameFileInProject(
  projectId: string,
  fileId: string,
  newName: string
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  const file = project.files.find(f => f.id === fileId)
  if (!file) return null

  // Check for duplicate
  if (project.files.some(f => f.name === newName && f.id !== fileId)) {
    throw new Error(`File "${newName}" already exists in project`)
  }

  // Update main file reference if needed
  const mainFile = file.name === project.mainFile ? newName : project.mainFile

  // Update file
  const updatedFiles = project.files.map(f =>
    f.id === fileId
      ? { ...f, name: newName, path: newName, type: getFileType(newName) }
      : f
  )

  return updateProject(projectId, {
    files: updatedFiles,
    mainFile
  })
}

/**
 * Set the main file for a project
 */
export async function setMainFile(
  projectId: string,
  fileName: string
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  const file = project.files.find(f => f.name === fileName)
  if (!file) {
    throw new Error(`File "${fileName}" not found in project`)
  }

  if (file.type !== 'tex') {
    throw new Error('Main file must be a .tex file')
  }

  return updateProject(projectId, {
    mainFile: fileName,
    settings: { ...project.settings, mainFile: fileName }
  })
}

/**
 * Duplicate a project
 */
export async function duplicateProject(
  projectId: string,
  newName?: string
): Promise<LatexProject | null> {
  const project = await getProject(projectId)
  if (!project) return null

  const now = Date.now()
  const id = generateId()

  const duplicatedProject: LatexProject = {
    ...project,
    id,
    name: newName || `${project.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    files: project.files.map(f => ({
      ...f,
      id: generateId()
    }))
  }

  const record: ProjectRecord = {
    id,
    project: duplicatedProject,
    updatedAt: now
  }

  await put(STORES.PROJECTS, record)
  return duplicatedProject
}

/**
 * Export project as JSON
 */
export function exportProjectAsJson(project: LatexProject): string {
  return JSON.stringify(project, null, 2)
}

/**
 * Export project as ZIP file
 */
export async function exportProjectAsZip(project: LatexProject): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Add all project files
  for (const file of project.files) {
    zip.file(file.name, file.content)
  }

  // Add project metadata
  zip.file('.project.json', JSON.stringify({
    name: project.name,
    mainFile: project.mainFile,
    settings: project.settings,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }, null, 2))

  return zip.generateAsync({ type: 'blob' })
}

/**
 * Download project as ZIP
 */
export async function downloadProjectAsZip(project: LatexProject): Promise<void> {
  const blob = await exportProjectAsZip(project)
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import project from ZIP file
 */
export async function importProjectFromZip(file: File): Promise<LatexProject> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(file)

  const files: ProjectFile[] = []
  let projectMeta: Partial<LatexProject> = {}

  // Extract files
  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const content = await zipEntry.async('string')

    if (name === '.project.json') {
      projectMeta = JSON.parse(content)
    } else {
      files.push({
        id: generateId(),
        name,
        path: name,
        content,
        type: getFileType(name),
        size: content.length,
      })
    }
  }

  const now = Date.now()
  const id = generateId()

  // Determine main file
  let mainFile = projectMeta.mainFile || 'main.tex'
  if (!files.some(f => f.name === mainFile)) {
    mainFile = files.find(f => f.name.endsWith('.tex'))?.name || files[0]?.name || 'main.tex'
  }

  const importedProject: LatexProject = {
    id,
    name: projectMeta.name || file.name.replace(/\.zip$/i, ''),
    files,
    mainFile,
    settings: projectMeta.settings || DEFAULT_PROJECT_SETTINGS,
    createdAt: now,
    updatedAt: now,
  }

  const record: ProjectRecord = {
    id,
    project: importedProject,
    updatedAt: now,
  }

  await put(STORES.PROJECTS, record)
  return importedProject
}

/**
 * Import project from JSON
 */
export async function importProjectFromJson(
  json: string,
  newName?: string
): Promise<LatexProject> {
  const parsed = JSON.parse(json) as LatexProject

  const now = Date.now()
  const id = generateId()

  const importedProject: LatexProject = {
    ...parsed,
    id,
    name: newName || parsed.name,
    createdAt: now,
    updatedAt: now,
    files: parsed.files.map(f => ({
      ...f,
      id: generateId()
    }))
  }

  const record: ProjectRecord = {
    id,
    project: importedProject,
    updatedAt: now
  }

  await put(STORES.PROJECTS, record)
  return importedProject
}

/**
 * Get file type from extension
 */
export function getFileType(fileName: string): ProjectFile['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'tex':
      return 'tex'
    case 'bib':
      return 'bib'
    case 'cls':
      return 'cls'
    case 'sty':
      return 'sty'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'pdf':
    case 'eps':
    case 'svg':
      return 'image'
    default:
      return 'other'
  }
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: ProjectFile['type']): string {
  switch (type) {
    case 'tex':
      return 'file-text'
    case 'bib':
      return 'book-open'
    case 'cls':
    case 'sty':
      return 'file-code'
    case 'image':
      return 'image'
    default:
      return 'file'
  }
}

/**
 * Calculate project size
 */
export function calculateProjectSize(project: LatexProject): number {
  return project.files.reduce((total, file) => total + file.size, 0)
}

/**
 * Get project statistics
 */
export function getProjectStats(project: LatexProject): {
  fileCount: number
  texFileCount: number
  totalSize: number
  mainFile: string
} {
  return {
    fileCount: project.files.length,
    texFileCount: project.files.filter(f => f.type === 'tex').length,
    totalSize: calculateProjectSize(project),
    mainFile: project.mainFile
  }
}
