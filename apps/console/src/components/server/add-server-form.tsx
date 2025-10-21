import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ServerVisibilityEnum } from '@a0dotrun/app/ty'
import { CircleAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import z from 'zod/v4'
import { NewServerForm } from '@/validations'
import { addNewServerFn } from '@/funcs'
import { useNavigate } from '@tanstack/react-router'

type NewServerFormValues = z.infer<typeof NewServerForm>

export function AddServerForm({ username }: { username: string }) {
  const navigate = useNavigate()
  const form = useForm<NewServerFormValues>({
    resolver: zodResolver(NewServerForm),
    defaultValues: {
      title: '',
      description: '',
      name: '',
      visibility: ServerVisibilityEnum.PRIVATE,
    },
    mode: 'onTouched',
  })

  async function onSubmit(values: NewServerFormValues) {
    const response = await addNewServerFn({
      data: {
        name: values.name,
        title: values.title,
        description: values.description,
        visibility: values.visibility,
      },
    })
    navigate({
      to: '/$username/servers/$owner/$name',
      params: { username, owner: response.username, name: response.name },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-none">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center font-mono">
                      {username}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <FormControl>
                      <Input
                        className="bg-background"
                        placeholder="my-awesome-server"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Pick a short and memorable name, like{' '}
                    <span className="font-mono">space-crm</span>. You can use
                    lower case characters and dashes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-background"
                      placeholder="Acme MCP Server"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short, descriptive title for your server.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-background"
                      placeholder="A brief description of your server."
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>Choose who can see this server.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  {/* <FormLabel>Visibility</FormLabel> */}
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ServerVisibilityEnum.PRIVATE}>
                        Private
                      </SelectItem>
                      <SelectItem value={ServerVisibilityEnum.PUBLIC}>
                        Public
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === ServerVisibilityEnum.PUBLIC
                      ? 'Anyone on the internet can see this server.'
                      : 'Only you can see this server.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>
            The CLI is required to link and deploy MCP servers.
          </AlertTitle>
        </Alert>
        <div className="flex justify-end">
          <Button
            className="w-1/2"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            Create Server
          </Button>
        </div>
      </form>
    </Form>
  )
}
