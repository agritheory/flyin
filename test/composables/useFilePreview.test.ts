import { beforeEach, afterEach } from 'vitest'
import { useFilePreview } from '../../src/composables/useFilePreview'
import { resetFilePreviewState } from '../test-utils'

describe('useFilePreview', () => {
  beforeEach(() => {
    resetFilePreviewState()
  })

  afterEach(() => {
    resetFilePreviewState()
  })

  it('shows a preview with explicit type', () => {
    const preview = useFilePreview()

    preview.show({
      url: 'https://example.com/report.pdf',
      type: 'pdf',
      title: 'Report',
    })

    expect(preview.isOpen.value).toBe(true)
    expect(preview.currentFile.value).toEqual({
      url: 'https://example.com/report.pdf',
      content: null,
      type: 'pdf',
      title: 'Report',
    })
  })

  it('detects file type from url extension', () => {
    const preview = useFilePreview()

    preview.show({ url: 'https://example.com/photo.jpg' })

    expect(preview.currentFile.value.type).toBe('image')
  })

  it('strips query strings when detecting type', () => {
    const preview = useFilePreview()

    preview.show({ url: 'https://example.com/doc.pdf?token=abc' })

    expect(preview.currentFile.value.type).toBe('pdf')
  })

  it('defaults to html when type cannot be detected', () => {
    const preview = useFilePreview()

    preview.show({ content: '<p>Hello</p>' })

    expect(preview.currentFile.value.type).toBe('html')
  })

  it('closes and clears preview state', () => {
    const preview = useFilePreview()
    preview.show({ url: 'https://example.com/video.mp4', title: 'Video' })

    preview.close()

    expect(preview.isOpen.value).toBe(false)
    expect(preview.currentFile.value).toEqual({
      url: null,
      content: null,
      type: null,
      title: null,
    })
  })

  it('toggles closed when already open', () => {
    const preview = useFilePreview()
    preview.show({ url: 'https://example.com/audio.mp3' })

    preview.toggle()

    expect(preview.isOpen.value).toBe(false)
  })

  it('toggles open when closed and options are provided', () => {
    const preview = useFilePreview()

    preview.toggle({ url: 'https://example.com/sheet.docx' })

    expect(preview.isOpen.value).toBe(true)
    expect(preview.currentFile.value.type).toBe('docx')
  })

  it('maps common extensions to preview types', () => {
    const preview = useFilePreview()
    const cases: Array<[string, string]> = [
      ['file.webm', 'video'],
      ['file.wav', 'audio'],
      ['file.svg', 'image'],
      ['file.htm', 'html'],
    ]

    for (const [filename, expectedType] of cases) {
      preview.show({ url: `https://example.com/${filename}` })
      expect(preview.currentFile.value.type).toBe(expectedType)
      preview.close()
    }
  })
})
