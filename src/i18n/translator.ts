export type Messages = Record<string, unknown>

function resolveMessage(messages: Messages, key: string): string | null {
  const parts = key.split('.')
  let current: unknown = messages

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in (current as Messages)) {
      current = (current as Messages)[part]
    } else {
      return null
    }
  }

  return typeof current === 'string' ? current : null
}

export function createTranslator(messages: Messages) {
  return (key: string, vars?: Record<string, string | number>): string => {
    let text = resolveMessage(messages, key) ?? key
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }
}

export type Translator = ReturnType<typeof createTranslator>
