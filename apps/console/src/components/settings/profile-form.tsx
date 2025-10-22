import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type z from 'zod/v4'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ProfileEditForm } from '@/validations'
import { updateProfileNameFn } from '@/funcs'

type NameFormValues = z.infer<typeof ProfileEditForm>

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const form = useForm<NameFormValues>({
    resolver: zodResolver(ProfileEditForm),
    defaultValues: { name: defaultName },
    mode: 'onTouched',
  })

  async function onSubmit(values: NameFormValues) {
    await updateProfileNameFn({ data: { name: values.name } })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  className="bg-background"
                  placeholder="Your name"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will be displayed on your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Name must not be longer than 32 characters.
          </p>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
