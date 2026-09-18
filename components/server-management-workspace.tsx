/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, Copy, ExternalLink, Globe2, Layers3, LifeBuoy, Link2, LoaderCircle, Network, Palette, Plus, RotateCcw, Save, Server, Settings2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ServerContentManager } from '@/components/server-content-manager'

type ServerInfo = {
  id: string
  name: string
  worldName?: string | null
  coverImageUrl?: string | null
  coverVideoUrl?: string | null
  connectionAddress?: string | null
  publicHost?: string | null
  port: number
  playerCount: number
  status: string
  serverSubtitle?: string | null
}

type WorkspaceSectionKey = 'overview' | 'connection' | 'worlds' | 'information' | 'support'

type Props = {
  server: ServerInfo[]
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
  onRefresh: () => void
  initialSection?: 'overview' | 'worlds'
}

type WorldData = {
  templates?: Array<{ id: string; name: string; description?: string; available?: boolean }>
  runtimeWorlds?: Array<{ name: string; isActive?: boolean; prepared?: boolean; sizeMb?: number; templateName?: string | null; maintenance?: { active?: boolean; label?: string; status?: string } }>
  canManage?: boolean
  runtimeError?: string | null
}



export function ServerManagementWorkspace({ server, selectedId, onSelect, onClose, onRefresh, initialSection = 'overview' }: Props) {
  const current = server.find(item => item.id === selectedId) ?? server[0]
  const [section, setSection] = useState<WorkspaceSectionKey>(initialSection)
  const [worlds, setWorlds] = useState<WorldData>({})
  const [worldName, setWorldName] = useState('')
  const [selectedWorld, setSelectedWorld] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverVideoUrl, setCoverVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [bindIp, setBindIp] = useState('')
  const [domainName, setDomainName] = useState('')
  const [srvRecord, setSrvRecord] = useState('')
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [connectionCanEdit, setConnectionCanEdit] = useState(false)
  const [connectionWritableKeys, setConnectionWritableKeys] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<{ nodeOnline?: boolean; serverStatus?: string; pendingApply?: boolean }>({})

  useEffect(() => {
    if (!current) return
    setSubtitle(current.serverSubtitle ?? '')
    setCoverImageUrl(current.coverImageUrl ?? '')
    setCoverVideoUrl(current.coverVideoUrl ?? '')
    setNotice('')
  }, [current?.id, current?.serverSubtitle, current?.coverImageUrl, current?.coverVideoUrl])

  async function loadWorlds() {
    if (!current) return
    try {
      const response = await fetch(`/api/worlds?serverId=${current.id}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Dünya verileri alınamadı.')
      const data = await response.json() as WorldData
      setWorlds(data)
      const firstAvailable = data.templates?.find(item => item.available !== false)
      setTemplateId(value => value || firstAvailable?.id || '')
      setSelectedWorld(value => value && data.runtimeWorlds?.some(item => item.name === value) ? value : data.runtimeWorlds?.[0]?.name ?? '')
    } catch (error) {
      setWorlds({ runtimeError: error instanceof Error ? error.message : 'Dünya verileri alınamadı.' })
    }
  }

  async function loadConnectionSettings() {
    if (!current) return
    setConnectionLoading(true)
    try {
      const response = await fetch(`/api/panel-settings?serverId=${encodeURIComponent(current.id)}`, { cache: 'no-store' })
      const data = await response.json().catch(() => ({})) as { settings?: Record<string, unknown>; canEdit?: boolean; writableKeys?: string[]; nodeOnline?: boolean; serverStatus?: string; pendingApply?: boolean; error?: string }
      if (!response.ok) throw new Error(data.error || 'IP ve domain ayarları alınamadı.')
      setBindIp(String(data.settings?.serverIp ?? ''))
      setDomainName(String(data.settings?.hostname ?? ''))
      setSrvRecord(String(data.settings?.srvRecord ?? ''))
      setConnectionCanEdit(data.canEdit === true)
      setConnectionWritableKeys(Array.isArray(data.writableKeys) ? data.writableKeys.map(String) : [])
      setConnectionStatus({ nodeOnline: data.nodeOnline, serverStatus: data.serverStatus, pendingApply: data.pendingApply })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'IP ve domain ayarları alınamadı.')
    } finally {
      setConnectionLoading(false)
    }
  }

  useEffect(() => { setWorlds({}); setTemplateId(''); setSelectedWorld(''); void loadWorlds(); void loadConnectionSettings() }, [current?.id])
  useEffect(() => { setSection(initialSection) }, [initialSection])

  if (!current) return null

  const preview = coverVideoUrl
    ? <video src={coverVideoUrl} autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover opacity-60" />
    : coverImageUrl
      ? <img src={coverImageUrl} alt="Sunucu kapak görseli" className="absolute inset-0 size-full object-cover opacity-60" />
      : null

  async function saveAppearance() {
    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/panel-settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ serverId: current.id, changes: { serverSubtitle: subtitle, coverImageUrl, coverVideoUrl } }),
      })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'Görünüm ayarları kaydedilemedi.')
      setNotice(data.message || 'Görünüm ayarları kaydedildi.')
      onRefresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Görünüm ayarları kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function createWorld() {
    if (!worldName.trim() || !templateId) {
      setNotice('Dünya adı ve kullanılabilir bir şablon seçin.')
      return
    }
    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/worlds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ serverId: current.id, action: 'create', worldName: worldName.trim(), templateId }),
      })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      setNotice(data.message ?? data.error ?? 'İşlem tamamlandı.')
      if (response.ok) {
        setSelectedWorld(worldName.trim())
        setWorldName('')
        await loadWorlds()
        onRefresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function worldAction(action: 'set-active' | 'reset' | 'delete', name: string) {
    let confirmName: string | undefined
    if (action === 'reset' || action === 'delete') {
      confirmName = window.prompt(`Onaylamak için dünya adını yazın: ${name}`) ?? undefined
      if (confirmName !== name) return
    }
    setSaving(true); setNotice('')
    try {
      const response = await fetch('/api/worlds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serverId: current.id, action, worldName: name, confirmName }) })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'Dünya işlemi başlatılamadı.')
      setNotice(data.message || 'Dünya işlemi kuyruğa alındı.')
      await loadWorlds(); onRefresh()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Dünya işlemi başlatılamadı.') }
    finally { setSaving(false) }
  }

  async function saveBindIp() {
    if (!current) return
    setSaving(true); setNotice('')
    try {
      const response = await fetch('/api/panel-settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serverId: current.id, changes: { serverIp: bindIp.trim() } }) })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'IP bind ayarı kaydedilemedi.')
      setNotice(data.message || 'IP bind ayarı uygulama kuyruğuna alındı.')
      await loadConnectionSettings(); onRefresh()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'IP bind ayarı kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function saveDomain() {
    if (!current) return
    const host = domainName.trim().toLowerCase()
    const suggestedSrv = host ? `0 5 ${current.port} ${host}` : ''
    setSaving(true); setNotice('')
    try {
      const response = await fetch('/api/panel-settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serverId: current.id, changes: { hostname: host, srvRecord: srvRecord.trim() || suggestedSrv } }) })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'Domain bilgileri kaydedilemedi.')
      if (!srvRecord.trim() && suggestedSrv) setSrvRecord(suggestedSrv)
      setNotice(data.message || 'Domain bağlantı bilgileri kaydedildi.')
      await loadConnectionSettings(); onRefresh()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Domain bilgileri kaydedilemedi.') }
    finally { setSaving(false) }
  }

  function openSupport(view: 'home' | 'info') {
    onClose()
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('blockctrl:open-support', { detail: { view } })), 0)
  }

  const openServerPanel = (targetSection?: string) => window.location.assign(`/servers/${current.id}${targetSection ? `?section=${targetSection}` : ''}`)

  return <div className="fixed inset-0 z-50 overflow-auto bg-[#020706]/90 p-3 backdrop-blur-md sm:p-6">
    <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#07100d] text-slate-100 shadow-2xl sm:min-h-[calc(100vh-3rem)]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div><div className="flex items-center gap-2 text-base font-semibold"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#4ade80]" />BLOCKCTRL Yönetim Merkezi</div><p className="mt-1 text-xs text-slate-500">Sunucu vitrinini, dünyaları ve topluluk araçlarını tek çalışma alanından yönetin.</p></div>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="mr-1 size-4" />Kapat</Button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/10 p-3 lg:border-b-0 lg:border-r">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Sunucular</p>
          <div className="space-y-1">{server.map(item => <button key={item.id} onClick={() => onSelect(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${item.id === current.id ? 'bg-emerald-400/15 text-emerald-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Server className="size-4" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span><ChevronRight className="size-3" /></button>)}</div>
          <div className="my-4 border-t border-white/10" />
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Yönetim</p>
          <div className="space-y-1">{[['overview', 'Sunucu görünümü', Palette], ['connection', 'IP & Domain', Network], ['worlds', 'Dünya & İçerik', Layers3], ['information', 'Bilgilendirme', BookOpen], ['support', 'Destekler', LifeBuoy]].map(([key, label, Icon]) => <button key={String(key)} onClick={() => setSection(String(key) as WorkspaceSectionKey)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${section === key ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon className="size-4" />{String(label)}</button>)}</div>
        </aside>
        <main className="min-w-0 overflow-y-auto p-4 sm:p-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-emerald-300">Seçili sunucu</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{current.name}</h1><p className="mt-1 text-sm text-slate-500">{current.connectionAddress ?? `${current.publicHost ?? 'IP bekleniyor'}:${current.port}`} · {current.status}</p></div><div className="flex items-center gap-2"><div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{current.playerCount} oyuncu</div><Button variant="outline" size="sm" onClick={() => openServerPanel()}><ExternalLink className="mr-2 size-4" />Tam panel</Button></div></div>
          {section === 'overview' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="overflow-hidden border-white/10 bg-black/20"><div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-emerald-950 to-slate-950">{preview}<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" /><div className="absolute bottom-5 left-5"><p className="text-xs uppercase tracking-[.18em] text-emerald-300">Canlı önizleme</p><h2 className="mt-2 text-3xl font-black">{current.name}</h2><p className="mt-1 text-slate-300">{subtitle || 'Sunucu açıklaması ekleyin'}</p></div></div><CardContent className="grid gap-3 p-5 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Durum</p><p className="mt-1 font-semibold">{current.status}</p></div><div><p className="text-xs text-slate-500">Oyuncular</p><p className="mt-1 font-semibold">{current.playerCount}</p></div><div><p className="text-xs text-slate-500">Adres</p><p className="mt-1 truncate font-mono text-sm">{current.connectionAddress ?? '—'}</p></div></CardContent></Card>
            <Card className="border-white/10 bg-black/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings2 className="size-4 text-emerald-300" />Hızlı yönetim</CardTitle><CardDescription>Sunucu kartında görünen açıklama ve medya ayarlarını kaydedin.</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={subtitle} onChange={event => setSubtitle(event.target.value)} maxLength={180} placeholder="Sunucu açıklaması" /><Input value={coverImageUrl} onChange={event => setCoverImageUrl(event.target.value)} placeholder="Kapak görseli HTTPS URL'si" /><Input value={coverVideoUrl} onChange={event => setCoverVideoUrl(event.target.value)} placeholder="Kapak videosu HTTPS URL'si (isteğe bağlı)" /><Button className="w-full" onClick={saveAppearance} disabled={saving}>{saving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}Görünümü kaydet</Button>{notice && <p className="text-sm text-amber-300" role="status">{notice}</p>}</CardContent></Card>
          </div>}
          {section === 'connection' && <WorkspaceSection title="IP & Domain Bağlantısı" description="Minecraft sunucusunun dinleyeceği IP adresini ve oyuncuların kullanacağı domain/DNS bilgisini yönetin.">
            <div className="grid gap-5 xl:grid-cols-2">
              <Card className="border-sky-400/15 bg-black/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Network className="size-4 text-sky-300"/>IP bağlama</CardTitle><CardDescription>server.properties içindeki server-ip bind adresini yönetir. Boş bırakmak çoğu kurulumda tüm ağ arayüzlerini dinlemek için önerilir.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-slate-500">Node public IP / host</p><p className="mt-1 truncate font-mono text-sm text-sky-200">{current.publicHost || 'IP bekleniyor'}</p></div><div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-slate-500">Minecraft portu</p><p className="mt-1 font-mono text-sm text-sky-200">{current.port}</p></div></div><div><label className="mb-2 block text-sm font-medium">Sunucu bind IP</label><Input value={bindIp} onChange={event=>setBindIp(event.target.value)} placeholder="Boş = tüm arayüzler (önerilen)" disabled={connectionLoading||!connectionCanEdit}/><p className="mt-2 text-xs leading-5 text-slate-500">Örnek: 0.0.0.0 yerine alanı boş bırakabilirsiniz. Belirli bir yerel IP kullanacaksanız adres node üzerinde gerçekten tanımlı olmalıdır.</p></div><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.02] p-3 text-xs"><span className={connectionStatus.nodeOnline?'text-emerald-300':'text-amber-300'}>{connectionStatus.nodeOnline?'● Node çevrimiçi':'● Node çevrimdışı'}</span><span className="text-slate-500">Sunucu: {connectionStatus.serverStatus || current.status}</span></div><Button className="w-full" onClick={()=>void saveBindIp()} disabled={saving||connectionLoading||!connectionCanEdit||!connectionWritableKeys.includes('serverIp')}><Save className="mr-2 size-4"/>{connectionWritableKeys.includes('serverIp')?'IP bind ayarını kaydet':'IP değiştirmek için sunucuyu durdur'}</Button></CardContent></Card>
              <Card className="border-cyan-400/15 bg-black/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="size-4 text-cyan-300"/>Domain bağlama</CardTitle><CardDescription>Oyuncuların IP yerine alan adıyla bağlanabilmesi için panelde domain kaydını tutar ve gerekli DNS kayıtlarını gösterir.</CardDescription></CardHeader><CardContent className="space-y-4"><div><label className="mb-2 block text-sm font-medium">Domain / hostname</label><Input value={domainName} onChange={event=>setDomainName(event.target.value)} placeholder="play.example.com" disabled={connectionLoading||!connectionCanEdit}/></div><div><label className="mb-2 block text-sm font-medium">SRV kaydı <span className="text-slate-500">(isteğe bağlı)</span></label><Input value={srvRecord} onChange={event=>setSrvRecord(event.target.value)} placeholder={domainName?`0 5 ${current.port} ${domainName}`:`0 5 ${current.port} play.example.com`} disabled={connectionLoading||!connectionCanEdit}/></div><div className="space-y-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[.04] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-cyan-200"><Link2 className="size-4"/>DNS sağlayıcınızda oluşturulacak kayıtlar</p><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-3"><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-wider text-slate-500">A / AAAA hedefi</p><code className="mt-1 block truncate text-xs text-slate-200">{domainName||'play.example.com'} → {current.publicHost||'NODE_PUBLIC_IP'}</code></div><Button variant="ghost" size="icon" onClick={()=>navigator.clipboard.writeText(`${domainName||'play.example.com'} -> ${current.publicHost||'NODE_PUBLIC_IP'}`)} aria-label="A kaydını kopyala"><Copy className="size-4"/></Button></div><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-3"><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-wider text-slate-500">Minecraft SRV</p><code className="mt-1 block truncate text-xs text-slate-200">_minecraft._tcp → {srvRecord||`0 5 ${current.port} ${domainName||'play.example.com'}`}</code></div><Button variant="ghost" size="icon" onClick={()=>navigator.clipboard.writeText(`_minecraft._tcp ${srvRecord||`0 5 ${current.port} ${domainName||'play.example.com'}`}`)} aria-label="SRV kaydını kopyala"><Copy className="size-4"/></Button></div><p className="text-xs leading-5 text-cyan-100/55">BlockCtrl domain bilgisini kaydeder; DNS sağlayıcınızda A/AAAA ve gerekiyorsa SRV kaydını siz oluşturduktan sonra alan adı sunucuya yönlenir.</p></div><Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={()=>void saveDomain()} disabled={saving||connectionLoading||!connectionCanEdit}><Globe2 className="mr-2 size-4"/>Domain bilgisini kaydet</Button></CardContent></Card>
            </div>
            {(notice||connectionStatus.pendingApply)&&<p className="mt-4 text-sm text-amber-300" role="status">{notice || 'Ayar değişikliği agent tarafından uygulanıyor.'}</p>}
          </WorkspaceSection>}
          {section === 'worlds' && <WorkspaceSection title="Dünya & İçerik Yönetimi" description="Dünyaları oluşturun, seçin, aktif edin, sıfırlayın veya silin; seçili dünyanın mod, plugin, config, resource pack ve dünya dosyalarını aynı ekrandan yönetin.">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-950/15 p-4"><div><p className="font-semibold text-amber-200">Bakım / güncelleme modu</p><p className="mt-1 text-xs leading-5 text-amber-100/70">Yeni oluşturulan veya güncellenen dünyalar agent işlemi tamamlanana ve doğrulama süresi bitene kadar <b>Bakımda / Güncelleniyor</b> olarak gösterilir.</p></div><Button variant="outline" size="sm" onClick={() => openServerPanel('worlds')}><ExternalLink className="mr-2 size-4"/>Gelişmiş dünya ayarları</Button></div>
            <div className="grid gap-3 lg:grid-cols-2">{worlds.runtimeWorlds?.map(world => { const maintenance=world.maintenance?.active===true; return <Card key={world.name} className={`border-white/10 bg-black/20 ${selectedWorld===world.name?'ring-1 ring-emerald-400/60':''}`}><CardContent className="p-4"><div className="flex items-start gap-3"><Layers3 className="mt-1 size-4 text-emerald-300"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{world.name}</p>{world.isActive&&<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">Aktif</span>}{maintenance&&<span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{world.maintenance?.label || 'Bakımda'}</span>}</div><p className="mt-1 text-xs text-slate-500">{world.templateName || (world.prepared?'İlk başlatma bekliyor':'Dünya klasörü')} · {Number(world.sizeMb||0).toFixed(0)} MB</p></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant={selectedWorld===world.name?'default':'outline'} onClick={()=>setSelectedWorld(world.name)}>İçeriği yönet</Button>{!world.isActive&&<Button size="sm" variant="outline" disabled={saving||maintenance||current.status==='running'} onClick={()=>void worldAction('set-active',world.name)}><CheckCircle2 className="mr-1 size-3"/>Aktif yap</Button>}<Button size="sm" variant="outline" disabled={saving||maintenance||current.status==='running'} onClick={()=>void worldAction('reset',world.name)}><RotateCcw className="mr-1 size-3"/>Sıfırla</Button><Button size="sm" variant="outline" className="text-red-300" disabled={saving||maintenance||current.status==='running'||world.isActive} onClick={()=>void worldAction('delete',world.name)}><Trash2 className="mr-1 size-3"/>Sil</Button></div></CardContent></Card>})}</div>
            {!!worlds.templates?.length && <div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-[.15em] text-slate-500">Yeni dünya türü / şablonu</p><div className="flex flex-wrap gap-2">{worlds.templates.map(template => <Button key={template.id} type="button" variant={templateId === template.id ? 'default' : 'outline'} size="sm" disabled={template.available === false} onClick={() => setTemplateId(template.id)}>{template.name}</Button>)}</div></div>}
            <div className="mt-4 flex flex-wrap gap-2"><Input value={worldName} onChange={event => setWorldName(event.target.value)} placeholder="Yeni dünya adı" className="min-w-52 flex-1"/><Button onClick={createWorld} disabled={saving||worlds.canManage===false||!templateId||current.status==='running'}>{saving?<LoaderCircle className="mr-2 size-4 animate-spin"/>:<Plus className="mr-2 size-4"/>}Dünya oluştur</Button></div>
            {current.status==='running'&&<p className="mt-2 text-xs text-amber-300">Dünya oluşturma, silme ve dosya değişiklikleri için sunucuyu durdurun.</p>}
            {selectedWorld&&<div className="mt-6"><div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-300">Seçili dünya</p><h3 className="mt-1 text-lg font-semibold">{selectedWorld} · İçerik ve dosyalar</h3><p className="mt-1 text-xs text-slate-500">Plugin/mod sunucu düzeyindedir; config, plugin ayarları, resource packler ve seçili dünya dosyaları bu dünya çalışma alanında birlikte gösterilir.</p></div><ServerContentManager serverId={current.id} running={current.status==='running'} canEdit={worlds.canManage!==false} scopeWorld={selectedWorld}/></div>}
            {(worlds.runtimeError || notice) && <p className="mt-4 text-sm text-amber-300" role="status">{notice || worlds.runtimeError}</p>}
          </WorkspaceSection>}
          {section === 'information' && <WorkspaceSection title="Bilgilendirme" description="Görsel, video, PDF, başlık, paragraf ve kopyalanabilir metin bloklarından oluşan bilgilendirme sayfasını yönetin."><ActionCard icon={<BookOpen className="size-5 text-sky-300" />} title="Bilgilendirme editörünü aç" description="Blok ekleyin, metin renklerini ve hizalamayı değiştirin; içerikleri sürükleyip sıralayın, düzenleyin veya silin." action="Editörü aç" onClick={() => openSupport('info')} /></WorkspaceSection>}
          {section === 'support' && <WorkspaceSection title="Destekler" description="Destek talepleri ve kullanıcı konuşmaları merkezi destek ekranında tutulur."><ActionCard icon={<LifeBuoy className="size-5 text-amber-300" />} title="Destek merkezini aç" description="Açık talepleri görüntüleyin, konuşmaları yönetin ve kullanıcıya yanıt verin." action="Destek merkezine git" onClick={() => openSupport('home')} /></WorkspaceSection>}
        </main>
      </div>
    </div>
  </div>
}

function WorkspaceSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section><div className="mb-5"><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{children}</section>
}

function ActionCard({ icon, title, description, action, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; onClick: () => void }) {
  return <Card className="max-w-2xl border-white/10 bg-black/20"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5">{icon}</div><div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div><Button onClick={onClick}>{action}<ExternalLink className="ml-2 size-4" /></Button></CardContent></Card>
}
