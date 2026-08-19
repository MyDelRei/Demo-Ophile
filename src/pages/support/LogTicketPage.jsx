import { useEffect, useState } from 'react'
import {
  ArrowLeftIcon,
  FileIcon,
  SendIcon,
  Trash2Icon,
  UploadCloudIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { createTicket } from '@/api/ticketApi'
import { getActiveTicketCategories } from '@/api/ticketCategoryApi'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import GlassPanel from '@/components/glass/GlassPanel'
import SupportPageShell from '@/components/support/SupportPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useAppFeedback } from '@/hooks/useAppFeedback'

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function LogTicketPage() {
  const { user } = useAuth()
  const { showLoading, hideLoading, showNotification } = useAppFeedback()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [attachments, setAttachments] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
  })

  useEffect(() => {
    let isActive = true

    getActiveTicketCategories(user.organisationId)
      .then((result) => {
        if (isActive) setCategories(result)
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            error.message || 'Unable to load ticket categories.',
            'error',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [showNotification, user.organisationId])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files ?? [])
    setAttachments((current) => [...current, ...files])
    event.target.value = ''
  }

  function handleDescriptionPaste(event) {
    const containsImage = Array.from(event.clipboardData?.items ?? []).some(
      (item) => item.type.startsWith('image/'),
    )

    if (containsImage) {
      event.preventDefault()
      showNotification('Please upload images using Attachments.', 'error')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    showLoading('Submitting ticket...')

    try {
      const ticket = await createTicket(user.id, {
        ...form,
        attachments: attachments.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      })
      showNotification('Ticket created successfully.')
      navigate(`/support/tickets/${ticket.id}`)
    } catch (error) {
      showNotification(error.message || 'Unable to create ticket.', 'error')
    } finally {
      hideLoading()
    }
  }

  return (
    <SupportPageShell
      title="Log Ticket"
      description="Describe the problem and include any files that will help the support team understand it."
      action={
        <Button
          render={<Link to="/support/tickets" />}
          nativeButton={false}
          variant="outline"
        >
          <ArrowLeftIcon />
          Tickets
        </Button>
      }
    >
      <GlassPanel className="mx-auto max-w-3xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticket-title">Ticket Title</Label>
            <Input
              id="ticket-title"
              className={glassFormControlClass}
              placeholder="Briefly describe the problem"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              className="min-h-44 border-border/80 bg-background/90 shadow-sm supports-[backdrop-filter]:bg-background/80"
              placeholder="Describe what happened, what you were trying to do, and any error you received."
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              onPaste={handleDescriptionPaste}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-category">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => updateField('categoryId', value)}
              required
            >
              <SelectTrigger
                id="ticket-category"
                className={`${glassFormControlClass} w-full`}
                aria-label="Select ticket category"
              >
                <SelectValue>
                  {form.categoryId
                    ? categories.find(
                        (category) => category.id === form.categoryId,
                      )?.name
                    : 'Select category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="ticket-attachments">Attachments</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Add screenshots or supporting files.
              </p>
            </div>
            <Input
              id="ticket-attachments"
              type="file"
              multiple
              className="sr-only"
              onChange={handleAttachmentChange}
            />
            <label
              htmlFor="ticket-attachments"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/55 px-6 py-7 text-center transition-colors hover:bg-background/80 focus-within:ring-3 focus-within:ring-ring/50"
            >
              <UploadCloudIcon className="size-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">Upload files</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Select one or more files from your device
              </span>
            </label>

            {attachments.length > 0 && (
              <ul className="space-y-2" aria-label="Selected attachments">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
                  >
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button
              render={<Link to="/support/tickets" />}
              nativeButton={false}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">
              <SendIcon />
              Submit Ticket
            </Button>
          </div>
        </form>
      </GlassPanel>
    </SupportPageShell>
  )
}

export default LogTicketPage
