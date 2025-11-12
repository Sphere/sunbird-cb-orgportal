export interface UploadPopupConfig {
  title: string
  subText?: string

  fileSection?: {
    dragText?: string
    uploadButton?: string
    allowedTypes?: string[] // e.g. ['.csv', '.xlsx']
  }

  dropdown?: {
    label?: string
    options?: string[]
    defaultValue?: string
  }

  actions?: {
    primary?: { label: string; disabled?: boolean }
    secondary?: { label: string }
  }

  additionalContent?: {
    show?: boolean
    html?: string // optional: parent can pass custom HTML block
  }
}
