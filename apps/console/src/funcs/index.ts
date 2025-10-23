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
import { setResponseStatus } from '@tanstack/react-start/server'
import { BetterAuthError } from 'better-auth'

export const activeServerCountFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
    return ServerTracker.activeCount(data.userId)
  })

export const topUsedServersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
    return ServerTracker.topUsedServers({
      userId: data.userId,
      limit: data.limit ?? 3,
    })
  })

export const recentlyViewedServersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
    return Server.userInstalledServers({
      userId: data.userId,
      limit: data.limit ?? 3,
      visibility: data.visibility,
    })
  })

export const githubUserInstallationFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; account: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user } }) => {
    if (!user) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
  .handler(async ({ data }) => {
    const response = await Server.config(data.serverId)
    return response
  })

export const updateProfileNameFn = createServerFn({ method: 'POST' })
  .inputValidator(ProfileEditForm)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { user: sessionUser } }) => {
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
    await User.update({
      id: sessionUser.userId,
      name: data.name,
    })
  })

export const userGitHubInstallationFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context: { user: sessionUser } }) => {
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
    if (!sessionUser) {
      setResponseStatus(401)
      throw new BetterAuthError('Unauthorized')
    }
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
