const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const STORAGE_KEY = 'utm_data'

type UtmData = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  landing_page?: string
}

/** URL에서 UTM 파라미터 + referrer 파싱 → sessionStorage 저장 */
export function captureUtm() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const data: UtmData = {}

  for (const key of UTM_KEYS) {
    const val = params.get(key)
    if (val) data[key] = val
  }

  if (document.referrer) {
    data.referrer = document.referrer
  }

  data.landing_page = window.location.pathname + window.location.search

  // UTM이 하나라도 있거나 referrer가 있으면 저장
  if (Object.keys(data).length > 1 || data.referrer) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/** sessionStorage에서 UTM 데이터 읽기 */
export function getUtm(): UtmData | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

/** sessionStorage UTM 데이터 삭제 */
export function clearUtm() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
