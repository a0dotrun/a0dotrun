import { useForm } from 'react-hook-form'
import z from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeploymentTarget } from '@riverly/app/ty'
import { CircleAlert } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export const GitHubDeployServerFormSchema = z.object({
  name: z.string(),
  repo: z.string(),
  rootDir: z.string().min(1, 'Root directory is required'),
  target: z.enum([DeploymentTarget.PREVIEW, DeploymentTarget.PRODUCTION]),
})

type GitHubDeployServerFormValues = z.infer<typeof GitHubDeployServerFormSchema>

export function GitHubDeployServerForm({
  username,
  name,
  repo,
}: {
  username: string
  name: string
  repo: string
}) {
  const form = useForm<GitHubDeployServerFormValues>({
    resolver: zodResolver(GitHubDeployServerFormSchema),
    defaultValues: {
      name: `${username}/${name}`,
      repo: repo,
      rootDir: './',
      target: DeploymentTarget.PREVIEW,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  //   Set default namespace when data loads
  //   useEffect(() => {
  //     if (!isLoading && !form.getValues("namespace")) {
  //       const defaultNamespace = namespacesWithFallback[0]?.name || "default";
  //       form.setValue("namespace", defaultNamespace);
  //     }
  //   }, [data, isLoading, form, namespacesWithFallback]);

  //   const handleNamespaceChange = (value: string) => {
  //     if (value === "new") {
  //       setIsCreatingNamespace(true);
  //       form.setValue("namespace", "", { shouldValidate: true });
  //       setNewNamespaceName("");
  //     } else {
  //       setIsCreatingNamespace(false);
  //       form.setValue("namespace", value, { shouldValidate: true });
  //       setNewNamespaceName("");
  //     }
  //   };

  //   const handleNewNamespaceInput = (value: string) => {
  //     setNewNamespaceName(value);
  //     form.setValue("namespace", value.trim(), {
  //       shouldValidate: true,
  //       shouldDirty: true,
  //       shouldTouch: true,
  //     });
  //   };

  function onSubmit(values: GitHubDeployServerFormValues) {
    console.log(values)
    // const formData = new FormData();
    // formData.append("name", values.name);
    // formData.append("repo", values.repo);
    // formData.append("namespace", values.namespace);
    // formData.append("rootDir", values.rootDir);
    // formData.append("target", values.target);
    // const result = await gitHubDeployServer(formData);
    // if (result.error) {
    //   toast.error("Something went wrong. Please try again later.", {
    //     description: result.error,
    //   });
    // } else {
    //   toast.success("Server deployed successfully!");
    //   router.push(`/app/${username}/deployments/${values.target}`);
    // }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Deploy Configuration</CardTitle>
            <CardDescription>
              Configure your server deployment settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="repo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rootDir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Directory</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-background"
                      placeholder="./"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The root directory of your Dockerfile. Use{' '}
                    <span className="font-mono">./</span> for the repository
                    root.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deployment Target</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-1/3">
                        <SelectValue placeholder="Select deployment target" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-1/3">
                      <SelectItem value={DeploymentTarget.PREVIEW}>
                        Preview
                      </SelectItem>
                      <SelectItem value={DeploymentTarget.PRODUCTION}>
                        Production
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>
            Use CLI is to customize the deployment configuration.
          </AlertTitle>
        </Alert>
        <Button
          size="lg"
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          Deploy
        </Button>
      </form>
    </Form>
  )
}
