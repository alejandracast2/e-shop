export const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

export const createUniqueSlug = (value = '', takenSlugs = [], options = {}) => {
  const { fallback = 'item', exclude = [] } = options
  const blocked = new Set(Array.from(takenSlugs).filter(Boolean))

  exclude.forEach((slug) => blocked.delete(slug))

  const baseSlug = slugify(value) || fallback

  if (!blocked.has(baseSlug)) {
    return baseSlug
  }

  let suffix = 2
  let candidate = `${baseSlug}-${suffix}`

  while (blocked.has(candidate)) {
    suffix += 1
    candidate = `${baseSlug}-${suffix}`
  }

  return candidate
}

export const flattenCategories = (items = []) => {
  const rows = []

  const visit = (category) => {
    rows.push(category)

    if (Array.isArray(category.children)) {
      category.children.forEach(visit)
    }
  }

  items.forEach(visit)
  return rows
}

export const flattenCategoryOptions = (items = [], depth = 0) =>
  items.flatMap((category) => {
    const option = {
      ...category,
      depth,
      label: `${depth > 0 ? `${'-- '.repeat(depth)}` : ''}${category.name}`,
    }

    if (Array.isArray(category.children) && category.children.length) {
      return [option, ...flattenCategoryOptions(category.children, depth + 1)]
    }

    return [option]
  })

export const buildCategoryTree = (categories = []) => {
  const byId = new Map()

  categories.forEach((category) => {
    byId.set(category.id, { ...category, children: [] })
  })

  const roots = []

  categories.forEach((category) => {
    const node = byId.get(category.id)
    if (!node) return

    if (category.parentId) {
      const parent = byId.get(category.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  const sortChildren = (nodes) => {
    nodes.sort((left, right) => {
      const byPosition = (left.position || 0) - (right.position || 0)
      if (byPosition !== 0) return byPosition
      return left.name.localeCompare(right.name)
    })

    nodes.forEach((node) => sortChildren(node.children))
  }

  sortChildren(roots)
  return roots
}

export const collectDescendantIds = (node) => {
  const ids = new Set()

  const visit = (currentNode) => {
    currentNode.children.forEach((child) => {
      ids.add(child.id)
      visit(child)
    })
  }

  visit(node)
  return ids
}
