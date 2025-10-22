import { createServerFn } from '@tanstack/react-start'
import {
  GitHub,
  Server,
  ServerDeployment,
  ServerTracker,
  User,
} from '@a0dotrun/app'
import { env } from '@a0dotrun/app/env'
import z from 'zod/v4'
import type { DeploymentTargetType, ServerVisibility } from '@a0dotrun/app/ty'
import type { GitHubImportServer } from '@a0dotrun/app/db/schema'
import { GitHubImportForm, NewServerForm, ProfileEditForm } from '@/validations'
import { authMiddleware } from '@/lib/auth-middleware'

export const activeServerCountFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    return ServerTracker.activeCount(data.userId)
  })

export const topUsedServersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    return ServerTracker.topUsedServers({
      userId: data.userId,
      limit: data.limit ?? 3,
    })
  })

export const recentlyViewedServersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    return ServerTracker.recentlyViewedServers({
      userId: data.userId,
      limit: data.limit ?? 3,
    })
  })

type DeploymentTarget = DeploymentTargetType | 'all'

export const deploymentsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { userId: string; limit?: number; target?: DeploymentTarget }) =>
      data,
  )
  .handler(async ({ data }) => {
    return ServerDeployment.deployments({
      userId: data.userId,
      limit: data.limit ?? 3,
      target: data.target ?? 'all',
    })
  })

export const serverDeploymentsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      userId: string
      limit?: number
      serverId: string
      target?: DeploymentTarget
    }) => data,
  )
  .handler(async ({ data }) => {
    return ServerDeployment.serverDeployments({
      userId: data.userId,
      serverId: data.serverId,
      limit: data.limit ?? 3,
      target: data.target ?? 'all',
    })
  })

export const userDeployment = createServerFn({ method: 'GET' })
  .inputValidator((data: { deploymentId: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const res = await ServerDeployment.userDeployment({
      userId: sessionUser.userId,
      deploymentId: data.deploymentId,
    })
    return res
  })

type Visibility = ServerVisibility | 'both'

export const userInstalledServersFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { userId: string; limit?: number; visibility: Visibility }) => data,
  )
  .handler(async ({ data }) => {
    return Server.userInstalledServers({
      userId: data.userId,
      limit: data.limit ?? 3,
      visibility: data.visibility,
    })
  })

export const githubUserInstallationFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; account: string }) => data)
  .handler(async ({ data }) => {
    return GitHub.userInstallation({
      userId: data.userId,
      githubAppId: env.GITHUB_APP_ID,
      account: data.account,
    })
  })

export const githubRepoDetailFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { owner: string; repo: string; githubInstallationId: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    return GitHub.repoDetail({
      githubInstallationId: data.githubInstallationId,
      owner: data.owner,
      repo: data.repo,
    })
  })

export const addNewServerFn = createServerFn({ method: 'POST' })
  .inputValidator(NewServerForm)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const newServer = {
      userId: sessionUser.userId,
      addedById: sessionUser.userId,
      username: sessionUser.username,
      name: data.name,
      title: data.title,
      description: data.description,
      isClaimed: false,
      visibility: data.visibility,
    }
    const response = await Server.addNew(newServer)
    return response
  })

export const getServerFromNameFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { username: string; name: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const response = await Server.fromName({
      callerUserId: sessionUser.userId,
      username: data.username,
      name: data.name,
    })
    return response
  })

export const getServerConfigFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { serverId: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const response = await Server.config(data.serverId)
    return response
  })

export const updateProfileNameFn = createServerFn({ method: 'POST' })
  .inputValidator(ProfileEditForm)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    await User.update({
      id: sessionUser.userId,
      name: data.name,
    })
  })

export const userGitHubInstallationFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const response = await GitHub.userInstallation({
      userId: sessionUser.userId,
      githubAppId: env.GITHUB_APP_ID,
      account: sessionUser.username,
    })
    return response
  })

export const importServerFromGitHub = createServerFn({ method: 'POST' })
  .inputValidator(GitHubImportForm.extend({ repoUrl: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) throw new Error('Unauthenticated')

    const request: z.infer<typeof GitHubImportServer> = {
      name: data.name,
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      userId: sessionUser.userId,
      username: sessionUser.username,
      addedById: sessionUser.userId,
      repoUrl: data.repoUrl,
    }
    const response = await Server.importFromGitHub({
      ...request,
      githubAppId: env.GITHUB_APP_ID,
    })
    return {
      serverId: response.serverId,
      username: response.username,
      name: response.name,
    }
  })
