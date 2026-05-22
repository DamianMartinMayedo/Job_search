export function renderTemplate(template, data) {
  if (!template?.body) return ''
  let result = template.body
  Object.entries(data).forEach(([key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value || '')
  })
  return result
}

export function renderSubject(template, data) {
  if (!template?.subject) return ''
  let result = template.subject
  Object.entries(data).forEach(([key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value || '')
  })
  return result
}
