declare module 'virtual:flyin-register' {
  export function registerFlyinSlots(): void
}

declare module 'virtual:flyin-desk-options' {
  export const flyinDeskOptions: {
    drawerMode: 'overlay' | 'push'
    navbarIcon?: string
    navbarTitle?: string
  }
}

declare module 'docx-preview' {
  export function renderAsync(
    document: ArrayBuffer | Blob | string,
    container: HTMLElement,
    styleContainer?: HTMLElement | null,
    options?: {
      ignoreLastRenderedPageBreak?: boolean
      experimental?: boolean
    }
  ): Promise<void>
}
