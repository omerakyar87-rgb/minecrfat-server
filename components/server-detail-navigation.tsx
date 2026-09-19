'use client'

import {
  ArrowLeft, Box, Clock3, Database, Download, FileText, Folder, Gamepad2, Globe2, LifeBuoy,
  Network, Package, Server as ServerIcon, Settings2, Shield, ShieldCheck, Signal, Terminal, Users, X, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const SERVER_NAV=[
  ['overview','Genel Bakış',Gamepad2],['console','Konsol',Terminal],['players','Oyuncular',Users],['files','Dosyalar',Folder],
  ['worlds','Dünyalar',Globe2],['software','Eklentiler / Modlar',Package],['databases','Veritabanları',Database],['backups','Yedekler',Clock3],
  ['schedules','Zamanlanmış Görevler',Clock3],['settings','Ayarlar',Settings2],['security','Güvenlik',ShieldCheck],['lost-items','Kayıp Eşya Takibi',Box],
  ['sftp','SFTP',Network],['integrations','Entegrasyonlar',Zap],['support','Destek',LifeBuoy],['logs','Günlükler',FileText],
  ['network','Ağ & Portlar',Signal],['bulk-download','Toplu İndirme',Download],['access','Erişim & Roller',Shield]
] as const

export type ServerNavKey=(typeof SERVER_NAV)[number][0]
export type ServerNavItem=(typeof SERVER_NAV)[number]

const GROUPS:Array<{label:string;keys:ServerNavKey[]}>= [
  {label:'Sunucu',keys:['overview','console','players']},
  {label:'İçerik',keys:['files','worlds','software','bulk-download']},
  {label:'Veri & otomasyon',keys:['databases','backups','schedules','lost-items']},
  {label:'Yönetim',keys:['settings','security','network','sftp','integrations','access']},
  {label:'Sistem',keys:['logs','support']},
]

type Props={
  open:boolean
  items:readonly ServerNavItem[]
  active:ServerNavKey
  serverName:string
  serverMeta:string
  coverUrl?:string|null
  processState:'ok'|'bad'|'warn'|'neutral'
  processStatusLabel:string
  heartbeatHealthy:boolean
  onlineNode:boolean
  diskPct:number
  onClose:()=>void
  onSelect:(key:ServerNavKey)=>void
  onBack:()=>void
}

export function ServerDetailNavigation({
  open,items,active,serverName,serverMeta,coverUrl,processState,processStatusLabel,heartbeatHealthy,onlineNode,diskPct,onClose,onSelect,onBack,
}:Props){
  const itemMap=new Map<ServerNavKey,ServerNavItem>(items.map(item=>[item[0],item] as [ServerNavKey,ServerNavItem]))
  return <aside className={`${open?'translate-x-0':'-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[236px] shrink-0 flex-col border-r border-[#18283b] bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,.13),transparent_36%),#091522] px-2.5 py-3 shadow-2xl transition-transform lg:static lg:translate-x-0`}>
    <div className="flex items-start justify-between border-b border-[#18283b] px-2 pb-4 pt-1">
      <div className="flex min-w-0 items-center"><img src="/blockctrl-logo.png" alt="BLOCKCTRL Sunucu Yönetim Paneli" className="h-[42px] w-auto max-w-[174px] object-contain object-left"/></div>
      <Button size="icon" variant="ghost" className="lg:hidden" onClick={onClose}><X className="size-4"/></Button>
    </div>

    <div className="mx-1 my-3 rounded-xl border border-[#1b3047] bg-[#0d1c2b] p-2.5">
      <div className="flex items-center gap-2.5">
        {coverUrl?<img src={coverUrl} alt="" className="size-10 rounded-lg object-cover"/>:<div className="grid size-10 place-items-center rounded-lg bg-sky-500/10 text-sky-300"><ServerIcon className="size-5"/></div>}
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{serverName}</p><p className="truncate text-xs text-slate-500">{serverMeta}</p></div>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-[#1b3047] pt-2">
        <span className="text-xs text-slate-500">Process</span>
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${processState==='ok'?'text-cyan-300':processState==='bad'?'text-red-400':processState==='warn'?'text-amber-300':'text-slate-400'}`}>
          <span className={`size-1.5 rounded-full ${processState==='ok'?'bg-cyan-400':processState==='bad'?'bg-red-400':processState==='warn'?'bg-amber-400':'bg-slate-500'}`}/>{processStatusLabel}
        </p>
      </div>
    </div>

    <nav className="flex flex-1 flex-col gap-3 overflow-y-auto pb-3" aria-label="Sunucu yönetimi">
      {GROUPS.map(group=>{
        const rows=group.keys.map(key=>itemMap.get(key)).filter(Boolean) as ServerNavItem[]
        if(!rows.length)return null
        return <div key={group.label}>
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-[.12em] text-slate-600">{group.label}</p>
          <div className="space-y-1">{rows.map(([key,label,Icon])=><button key={key} aria-current={active===key?'page':undefined} onClick={()=>onSelect(key)} className={`group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition ${active===key?'border border-sky-500/30 bg-gradient-to-r from-blue-600/45 to-sky-500/20 text-white shadow-[inset_2px_0_0_#38bdf8,0_0_24px_rgba(14,165,233,.08)]':'border border-transparent text-slate-300 hover:border-[#203a55] hover:bg-[#0d1c2c] hover:text-white'}`}><Icon className={`size-4 shrink-0 ${active===key?'text-sky-300':'text-slate-400 group-hover:text-sky-300'}`}/>{label}</button>)}</div>
        </div>
      })}
    </nav>

    <button onClick={onBack} className="mb-3 flex min-h-10 items-center gap-3 rounded-lg border border-transparent px-3 text-left text-xs font-medium text-slate-300 hover:bg-sky-950/25 hover:text-white"><ArrowLeft className="size-4 text-slate-400"/>Sunucu Listesi</button>
    <div className="border-t border-[#18283b] px-2 pt-3 text-xs text-slate-500">
      <div className="flex items-center justify-between"><span>Node</span><span className={heartbeatHealthy?'text-sky-300':'text-amber-300'}>{heartbeatHealthy?'Bağlı':'Doğrulanmadı'}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{width:`${onlineNode?Math.max(4,Math.min(100,diskPct)):4}%`}}/></div>
    </div>
  </aside>
}
