'use client'
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Globe,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import type { GitHubRepo } from '@riverly/app/ty'
import { GitHubIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { useGitHubInstalls } from '@/hooks/use-github-installs'
import { useRepos } from '@/hooks/use-repos'

import { cn } from '@/lib/utils'

export function GitHubSelectRepo({ username }: { username: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [selectedOwner, setSelectedOwner] = React.useState<string>(username)
  const [installDropdownOpen, setInstallDropdownOpen] = React.useState(false)

  const { data, isLoading, isError, mutate } = useRepos(selectedOwner)
  const {
    data: installData,
    isLoading: isInstallsLoading,
    isError: isInstallErr,
  } = useGitHubInstalls()

  const handleImportClick = () => {
    if (value) {
      const [owner, name] = value.split('/')
      navigate({
        to: '/$username/servers/import',
        params: { username },
        search: { owner, name },
      })
    }
  }

  const handleInstallClick = () => {
    const popup = window.open(
      'https://github.com/apps/riverly/installations/new',
      'Installing a0',
      'width=800,height=700,scrollbars=yes,resizable=yes,centerscreen=yes',
    )

    // Listen for when the popup is closed to refresh data
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        // Trigger a data refresh when popup is closed
        mutate().then(() => {})
      }
    }, 1000)
  }

  const handleRetry = () => {
    mutate().then(() => {})
  }

  const repositories =
    data?.repos.map((repo: GitHubRepo) => ({
      value: repo.fullName,
      label: repo.fullName,
      id: repo.id,
      private: repo.private,
    })) || []

  const isInstalled = data?.isInstalled ?? false

  if (isLoading || isInstallsLoading) {
    return (
      <div className="p-4 border border-border/70 hover:border-border/100 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-4 w-4" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-80 mt-2" />
      </div>
    )
  }

  if (isError || isInstallErr) {
    return (
      <div className="p-4 border border-destructive/50 hover:border-destructive/70 transition-colors bg-destructive/5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-4 w-4" />
            {installData?.installs && installData.installs.length > 0 && (
              <Popover
                open={installDropdownOpen}
                onOpenChange={setInstallDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={installDropdownOpen}
                    className="w-32 justify-between px-3 font-normal h-9"
                    disabled={true}
                  >
                    <span className="text-sm font-mono truncate">
                      {selectedOwner}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {installData.installs.map((install) => (
                          <CommandItem
                            key={install.githubInstallationId}
                            value={install.accountLogin}
                            onSelect={() => {
                              setSelectedOwner(install.accountLogin)
                              setValue('') // Reset selected repo
                              setInstallDropdownOpen(false)
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-mono">
                                {install.accountLogin}
                              </span>
                              <Check
                                className={cn(
                                  'h-4 w-4',
                                  selectedOwner === install.accountLogin
                                    ? 'opacity-100 text-primary'
                                    : 'opacity-0',
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Failed to load repositories
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <p className="text-sm mt-3 text-muted-foreground">
          There was an error loading your GitHub repositories. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 border border-border/70 hover:border-border/100 transition-colors">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-2">
          <GitHubIcon className="h-4 w-4" />
          {installData?.installs && installData.installs.length > 0 && (
            <Popover
              open={installDropdownOpen}
              onOpenChange={setInstallDropdownOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={installDropdownOpen}
                  className="w-32 justify-between px-3 font-normal h-9"
                >
                  <span className="text-sm font-mono truncate">
                    {selectedOwner}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {installData.installs.map((install) => (
                        <CommandItem
                          key={install.githubInstallationId}
                          value={install.accountLogin}
                          onSelect={() => {
                            setSelectedOwner(install.accountLogin)
                            setValue('') // Reset selected repo
                            setInstallDropdownOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-mono">
                              {install.accountLogin}
                            </span>
                            <Check
                              className={cn(
                                'h-4 w-4',
                                selectedOwner === install.accountLogin
                                  ? 'opacity-100 text-primary'
                                  : 'opacity-0',
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Repository selector */}
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between px-3 font-normal"
                disabled={!isInstalled}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {!isInstalled ? (
                    <span className="text-muted-foreground">
                      Install GitHub App to access repositories
                    </span>
                  ) : value ? (
                    <>
                      {repositories.find((repo) => repo.value === value)
                        ?.private ? (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium truncate font-mono">
                          {
                            repositories.find((repo) => repo.value === value)
                              ?.label
                          }
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Select repository...
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            {isInstalled && (
              <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width] min-w-[400px] max-w-[600px]"
                align="start"
                side="bottom"
              >
                <Command>
                  <CommandInput
                    placeholder="Search repositories..."
                    className="h-10 border-0 focus:ring-0"
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No repositories found.
                    </CommandEmpty>
                    <CommandGroup>
                      {repositories.map((repo) => (
                        <CommandItem
                          key={repo.value}
                          value={repo.value}
                          onSelect={(currentValue) => {
                            setValue(currentValue === value ? '' : currentValue)
                            setOpen(false)
                          }}
                          className="px-3 py-3 cursor-pointer hover:bg-accent/50 aria-selected:bg-accent"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {repo.private ? (
                                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate font-mono">
                                  {repo.label}
                                </div>
                              </div>
                            </div>
                            <Check
                              className={cn(
                                'ml-3 h-4 w-4 shrink-0',
                                value === repo.value
                                  ? 'opacity-100 text-primary'
                                  : 'opacity-0',
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            )}
          </Popover>
        </div>

        {isInstalled ? (
          <Button
            variant="default"
            className="w-full sm:w-auto"
            disabled={!value}
            onClick={handleImportClick}
          >
            Import
          </Button>
        ) : (
          <Button
            variant="default"
            className="w-full sm:w-auto"
            onClick={handleInstallClick}
          >
            <GitHubIcon className="mr-2 h-4 w-4" />
            Install
          </Button>
        )}
      </div>
      <p className="text-sm mt-2">
        {isInstalled ? (
          <>
            Missing Git repository?{' '}
            <button
              className="text-blue-600 hover:underline underline-offset-4"
              onClick={handleInstallClick}
            >
              Adjust GitHub App permissions →
            </button>
          </>
        ) : (
          'Install the GitHub application to import repositories.'
        )}
      </p>
    </div>
  )
}
