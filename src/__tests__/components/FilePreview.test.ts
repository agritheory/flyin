import { mount } from '@vue/test-utils'
import { beforeEach, afterEach } from 'vitest'
import FilePreview from '../../components/FilePreview.vue'
import { useFilePreview } from '../../composables/useFilePreview'
import { resetFilePreviewState } from '../../test-utils'

describe('FilePreview', () => {
  beforeEach(() => {
    resetFilePreviewState()
  })

  afterEach(() => {
    resetFilePreviewState()
    document.body.classList.remove('flyout-preview-open')
  })

  it('renders closed by default', () => {
    const wrapper = mount(FilePreview, { attachTo: document.body })

    expect(wrapper.find('.file-preview--open').exists()).toBe(false)

    wrapper.unmount()
  })

  it('shows image preview for image urls', async () => {
    const preview = useFilePreview()
    preview.show({
      url: 'https://example.com/photo.png',
      title: 'Photo',
    })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-preview--open').exists()).toBe(true)
    expect(wrapper.find('.file-preview__title').text()).toBe('Photo')
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/photo.png')

    wrapper.unmount()
  })

  it('shows pdf iframe for pdf urls', async () => {
    useFilePreview().show({
      url: 'https://example.com/report.pdf',
      title: 'Report',
    })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('iframe').attributes('src')).toBe('https://example.com/report.pdf')

    wrapper.unmount()
  })

  it('renders html content preview', async () => {
    useFilePreview().show({
      content: '<p>Hello world</p>',
      type: 'html',
      title: 'Message',
    })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-preview__html').html()).toContain('<p>Hello world</p>')

    wrapper.unmount()
  })

  it('closes when close button is clicked', async () => {
    const preview = useFilePreview()
    preview.show({ url: 'https://example.com/file.mp3' })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    await wrapper.find('.file-preview__close').trigger('click')

    expect(preview.isOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('closes on Escape key', async () => {
    const preview = useFilePreview()
    preview.show({ url: 'https://example.com/file.mp3' })

    mount(FilePreview, { attachTo: document.body })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(preview.isOpen.value).toBe(false)
  })

  it('adds body class while preview is open', async () => {
    useFilePreview().show({ url: 'https://example.com/file.mp3' })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(document.body.classList.contains('flyout-preview-open')).toBe(true)

    wrapper.unmount()

    expect(document.body.classList.contains('flyout-preview-open')).toBe(false)
  })

  it('shows fallback when preview url is missing for typed preview', async () => {
    useFilePreview().show({
      type: 'video',
      title: 'Missing URL',
    })

    const wrapper = mount(FilePreview, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-preview__fallback').exists()).toBe(true)
    expect(wrapper.find('.file-preview__fallback').text()).toContain('Unable to preview')

    wrapper.unmount()
  })
})
