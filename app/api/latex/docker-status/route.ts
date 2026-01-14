import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DOCKER_IMAGE = 'texlive/texlive:latest-full'

interface DockerStatusResponse {
  available: boolean
  dockerRunning: boolean
  imageAvailable: boolean
  image: string
  message: string
  pullCommand?: string
}

/**
 * Check Docker availability and TexLive image status
 * GET /api/latex/docker-status
 */
export async function GET(): Promise<NextResponse<DockerStatusResponse>> {
  try {
    // Check if Docker daemon is running
    await execAsync('docker info', { timeout: 5000 })

    // Check if texlive image exists locally
    const { stdout } = await execAsync(`docker images -q ${DOCKER_IMAGE}`, { timeout: 10000 })
    const imageExists = stdout.trim().length > 0

    if (imageExists) {
      return NextResponse.json({
        available: true,
        dockerRunning: true,
        imageAvailable: true,
        image: DOCKER_IMAGE,
        message: 'Docker is ready for LaTeX compilation with full TexLive support'
      })
    } else {
      return NextResponse.json({
        available: false,
        dockerRunning: true,
        imageAvailable: false,
        image: DOCKER_IMAGE,
        message: `Docker is running but the TexLive image needs to be pulled (~5GB download)`,
        pullCommand: `docker pull ${DOCKER_IMAGE}`
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Determine if Docker is not installed or just not running
    const isNotInstalled = message.includes('not found') || message.includes('command not found')
    const isNotRunning = message.includes('Cannot connect') || message.includes('Is the docker daemon running')

    let userMessage = 'Docker is not available'
    if (isNotInstalled) {
      userMessage = 'Docker is not installed. Please install Docker Desktop from https://docker.com'
    } else if (isNotRunning) {
      userMessage = 'Docker is installed but not running. Please start Docker Desktop'
    }

    return NextResponse.json({
      available: false,
      dockerRunning: false,
      imageAvailable: false,
      image: DOCKER_IMAGE,
      message: userMessage,
      pullCommand: `docker pull ${DOCKER_IMAGE}`
    })
  }
}
