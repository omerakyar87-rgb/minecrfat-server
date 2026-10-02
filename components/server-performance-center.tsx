'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'

type Distances = Record<'view-distance' | 'simulation-distance', string | null>
type Status = {
  serverStatus: string; canEdit: boolean; nodeOnline: boolean; agentSettingsWritable: boolean; pendingApply: boolean
  lastApplyError?: string | null
  performance?: { version: number; error?: string; current: Distances; backup: { createdAt: string; before: Distances; applied: Distances } | null } | null
  latestMetric?: { createdAt: string; tps: number | null; mspt: number | null; cpuPercent: number; memoryUsedMb: number; memoryTotalMb: number; players: number } | null
}
const profiles = [
  { id: 'balanced', name: 'Dengeli', view: 8, simulation: 6, description: 'Görüşü 8, simülasyonu 6 chunk ile sınırlar.' },
  { id: 'lowResource', name: 'Düşük kaynak', view: 6, simulation: 4, description: 'Görüşü 6, simülasyonu 4 chunk ile sınırlar; uzaktaki çiftlik ve redstone etkinliği azalabilir.' },
] as const
const fetcher = async (url: string): Promise<Status> => {
  const response = await fetch(url, { cache: 'no-store' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Performans verisi alınamadı')
  return data
}
export function ServerPerformanceCenter({ serverId }: { serverId: string }) {
  const { data, error, mutate } = useSWR(`/api/panel-settings?serverId=${serverId}&performance=1`, fetcher, { refreshInterval: 15_000 })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState('balanced')
  const performance = data?.performance
  const metric = data?.latestMetric
  const fresh = !!metric && !!data?.nodeOnline && data.serverStatus === 'running' && Date.now() - new Date(metric.createdAt).getTime() < 60_000
  const ready = !!performance && performance.version === 1 && !performance.error
  const canApply = !!data?.canEdit && !!data.agentSettingsWritable && ready && !data.pendingApply && !busy
  const selected = profiles.find(item => item.id === profile) ?? profiles[0]
  const target = (key: keyof Distances, cap: number) => {
    const current = Number(performance?.current?.[key])
    return Number.isInteger(current) && current >= 2 ? Math.min(current, cap) : cap
  }
  async function apply(action: 'apply' | 'restore') {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/panel-settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serverId, performanceAction: action, profile }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'İşlem başarısız')
      setMessage(result.message)
      await mutate()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'İşlem başarısız') }
    finally { setBusy(false) }
  }
  const lag = fresh && ((metric?.tps !== null && Number(metric?.tps) < 18) || (metric?.mspt !== null && Number(metric?.mspt) > 50))
  return <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-[#061522] p-4">
    <div><h3 className="font-semibold text-white">Lag azaltma</h3><p className="mt-1 text-xs text-slate-400">Agent ölçümleri ve yedekli Minecraft performans profilleri.</p></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        ['TPS', fresh && metric?.tps != null ? metric.tps.toFixed(1) : 'Veri yok'],
        ['MSPT', fresh && metric?.mspt != null ? metric.mspt.toFixed(1) : 'Veri yok'],
        ['CPU (node payı)', fresh ? `${metric?.cpuPercent.toFixed(1)}%` : 'Veri yok'],
        ['JVM RSS / RAM bütçesi', fresh ? `${metric?.memoryUsedMb} / ${metric?.memoryTotalMb} MB` : 'Veri yok'],
      ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950/60 p-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold text-white">{value}</div></div>)}
    </div>
    <p className="text-xs text-slate-300">{!fresh ? 'Son 60 saniyede doğrulanmış agent ölçümü yok. Sunucu çalışırken veriler 15 saniyede yenilenir.' : lag ? 'Tick gecikmesi görülüyor (TPS <18 veya MSPT >50 ms). Mesafeleri azaltmak yükü düşürebilir; kesin nedeni belirlemek için profiler raporunu inceleyin.' : metric?.tps == null && metric?.mspt == null ? 'Kaynak verisi geliyor; TPS/MSPT bu sunucuda henüz alınamıyor. Tick performansı değerlendirilemedi.' : 'Son ölçümde tick gecikmesi eşiği aşılmadı. Kalıcı etkiyi benzer oyuncu yükünde karşılaştırın.'}</p>
    {fresh && metric && <p className="text-xs text-slate-500">Ölçüm: {new Date(metric.createdAt).toLocaleString('tr-TR')} </p>}
    {!ready && <p className="text-xs text-amber-200">{performance?.error || 'Performans modülü için agent güncellemesi gerekiyor.'}</p>}
    {ready && <p className="text-xs text-slate-300">Dosyadaki mesafeler: görüş {performance.current?.['view-distance'] ?? 'varsayılan'} · simülasyon {performance.current?.['simulation-distance'] ?? 'varsayılan'}</p>}
    <div className="grid gap-3 md:grid-cols-2">{profiles.map(item => <button key={item.id} onClick={() => setProfile(item.id)} aria-pressed={profile === item.id} className={`rounded-xl border p-3 text-left ${profile === item.id ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-slate-700'}`}><div className="text-sm font-semibold text-white">{item.name}</div><p className="mt-1 text-xs text-slate-400">{item.description}</p></button>)}</div>
    <p className="text-xs text-slate-300">Uygulanacak: görüş {target('view-distance', selected.view)} · simülasyon {Math.min(target('simulation-distance', selected.simulation), target('view-distance', selected.view))}. Daha düşük mevcut değerler artırılmaz. Yalnız bu iki ayar değişir; uzak chunk görünürlüğü ve etkinliği azalır. Sonraki sunucu başlangıcında etkinleşir.</p>
    <div className="flex flex-wrap gap-2">
      <Button disabled={!canApply || !!performance?.backup} onClick={() => apply('apply')}>Yedek al ve profili uygula</Button>
      <Button variant="outline" disabled={!canApply || !performance?.backup} onClick={() => apply('restore')}>Önceki mesafeleri geri al</Button>
    </div>
    {performance?.backup && <p className="text-xs text-cyan-200">Yedek: {new Date(performance.backup.createdAt).toLocaleString('tr-TR')} · Eski görüş {performance.backup.before['view-distance'] ?? 'varsayılan'}, simülasyon {performance.backup.before['simulation-distance'] ?? 'varsayılan'}. Sonradan farklı değiştirilen mesafeler geri alma sırasında korunur ve işlem durdurulur.</p>}
    {!data?.agentSettingsWritable && <p className="text-xs text-amber-200">Uygulama ve geri alma için Minecraft sunucusunu durdurun ve agent bağlantısını kontrol edin.</p>}
    {data?.pendingApply && <p className="text-xs text-amber-200">Agent işlemi bekleniyor; sonuç otomatik yenilenecek.</p>}
    {(message || data?.lastApplyError || error) && <p role="status" className="text-xs text-amber-200">{error?.message || data?.lastApplyError || message}</p>}
    <p className="text-xs text-slate-500">Paper/Purpur üzerinde Spark profiler ile plugin, entity ve chunk yükünü inceleyin. Vanilla, Fabric ve Forge için kendi sürümünüzle uyumlu profiler kullanın. Profiller plugin/mod yüklemez.</p>
  </section>
}
