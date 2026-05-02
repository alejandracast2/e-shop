export const createProductImageInput = (image = {}, index = 0) => ({
  fileId: image.fileId || image.file?.id || undefined,
  url: image.url || image.file?.url || '',
  sortOrder: index,
  isCover: index === 0,
})

export const normalizeProductImages = (images = []) =>
  images
    .map((image, index) => createProductImageInput(image, index))
    .filter((image) => image.fileId || image.url)
