import { useEffect, useState } from 'react'
import {
  BanIcon,
  CircleCheckIcon,
  PencilIcon,
  PlusIcon,
} from 'lucide-react'

import {
  activateTicketCategory,
  createTicketCategory,
  deactivateTicketCategory,
  getTicketCategories,
  updateTicketCategory,
} from '@/api/ticketCategoryApi'
import IconActionButton from '@/components/common/IconActionButton'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'
import { formatTicketDate } from '@/lib/supportTicketUtils'

function CategoryFormDialog({ category, name, onNameChange, onOpenChange, onSubmit, open }) {
  const editing = Boolean(category)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Ticket Category' : 'Create Ticket Category'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the category name. Historical ticket references will be preserved.'
              : 'Create an active Category for new Company tickets.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticket-category-name">Category Name</Label>
            <Input
              id="ticket-category-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Printer"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CategoryStatusDialog({ change, onConfirm, onOpenChange }) {
  const activating = change?.targetStatus === 'ACTIVE'
  return (
    <Dialog open={Boolean(change)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activating ? 'Activate Ticket Category' : 'Deactivate Ticket Category'}
          </DialogTitle>
          <DialogDescription>
            {activating
              ? `Activate ${change?.category.name}? It will be available for new tickets.`
              : `Deactivate ${change?.category.name}? Historical tickets will keep this Category, but it cannot be selected for new tickets.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={activating ? 'default' : 'destructive'}
            onClick={onConfirm}
          >
            {activating ? 'Activate Category' : 'Deactivate Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TicketCategoriesPage() {
  const { user } = useAuth()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [statusChange, setStatusChange] = useState(null)

  async function refreshCategories() {
    const items = await getTicketCategories(user.organisationId)
    setCategories(items)
    setIsLoading(false)
  }

  useEffect(() => {
    let isActive = true
    getTicketCategories(user.organisationId)
      .then((items) => {
        if (isActive) {
          setCategories(items)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        if (isActive) {
          setIsLoading(false)
          showNotification(
            error.message || 'Unable to load Ticket Categories.',
            'error',
          )
        }
      })
    return () => {
      isActive = false
    }
  }, [showNotification, user.organisationId])

  function openCreateDialog() {
    setEditingCategory(null)
    setCategoryName('')
    setFormOpen(true)
  }

  function openEditDialog(category) {
    setEditingCategory(category)
    setCategoryName(category.name)
    setFormOpen(true)
  }

  function handleFormOpenChange(open) {
    setFormOpen(open)
    if (!open) {
      setEditingCategory(null)
      setCategoryName('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const editing = Boolean(editingCategory)
    showLoading(
      editing
        ? 'Updating Ticket Category...'
        : 'Creating Ticket Category...',
    )
    try {
      if (editingCategory) {
        await updateTicketCategory(
          editingCategory.id,
          { name: categoryName },
          user.organisationId,
        )
      } else {
        await createTicketCategory(user.organisationId, { name: categoryName })
      }
      handleFormOpenChange(false)
      await refreshCategories()
      showNotification(
        editing
          ? 'Ticket Category updated successfully.'
          : 'Ticket Category created successfully.',
      )
    } catch (error) {
      showNotification(
        error.message || 'Unable to save Ticket Category.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleStatusChange() {
    const activating = statusChange.targetStatus === 'ACTIVE'
    showLoading(
      activating
        ? 'Activating Ticket Category...'
        : 'Deactivating Ticket Category...',
    )
    try {
      if (activating) {
        await activateTicketCategory(
          statusChange.category.id,
          user.organisationId,
        )
      } else {
        await deactivateTicketCategory(
          statusChange.category.id,
          user.organisationId,
        )
      }
      setStatusChange(null)
      await refreshCategories()
      showNotification(
        activating
          ? 'Ticket Category activated successfully.'
          : 'Ticket Category deactivated successfully.',
      )
    } catch (error) {
      showNotification(
        error.message || 'Unable to update Ticket Category status.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage the Company Categories available when requesters log tickets.
        </p>
        <Button onClick={openCreateDialog}>
          <PlusIcon />
          Create Category
        </Button>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-semibold">Ticket Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inactive Categories remain on historical tickets but cannot be selected for new tickets.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading Ticket Categories...</TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {category.name}
                      {category.system && <Badge variant="secondary">System</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {category.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatTicketDate(category.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <IconActionButton
                        icon={PencilIcon}
                        title={category.system ? 'System Category cannot be edited' : 'Edit Category'}
                        variant="outline"
                        size={32}
                        disabled={category.system}
                        onClick={() => openEditDialog(category)}
                      />
                      <IconActionButton
                        icon={category.status === 'ACTIVE' ? BanIcon : CircleCheckIcon}
                        title={
                          category.system
                            ? 'System Category cannot be deactivated'
                            : category.status === 'ACTIVE'
                              ? 'Deactivate Category'
                              : 'Activate Category'
                        }
                        variant={category.status === 'ACTIVE' ? 'destructive' : 'outline'}
                        size={32}
                        disabled={category.system}
                        onClick={() =>
                          setStatusChange({
                            category,
                            targetStatus:
                              category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassPanel>

      <CategoryFormDialog
        category={editingCategory}
        name={categoryName}
        onNameChange={setCategoryName}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSubmit}
        open={formOpen}
      />
      <CategoryStatusDialog
        change={statusChange}
        onConfirm={handleStatusChange}
        onOpenChange={(open) => {
          if (!open) setStatusChange(null)
        }}
      />
    </GlassSection>
  )
}

export default TicketCategoriesPage
