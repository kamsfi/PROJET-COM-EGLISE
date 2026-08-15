import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { getAttachmentSignedUrl } from '../lib/storage'

export default function AttachmentPreview({ path, name, type }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAttachmentSignedUrl(path)
      .then(u => { if (!cancelled) setUrl(u) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [path])

  const isImage = type?.startsWith('image/')

  if (isImage) {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt={name} className="max-w-[200px] max-h-[200px] rounded-xl object-cover" />
      </a>
    ) : (
      <div className="w-[160px] h-[120px] rounded-xl bg-night-700 animate-pulse" />
    )
  }

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noreferrer"
      onClick={e => { if (!url) e.preventDefault() }}
      className="flex items-center gap-2 bg-night-800/80 hover:bg-night-800 rounded-xl px-3 py-2.5 max-w-[220px] transition-colors"
    >
      <FileText className="w-5 h-5 text-gold shrink-0" />
      <span className="text-xs text-slate-200 truncate">{name}</span>
    </a>
  )
}
