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
  return <aside className={`${open?'translate-x-0':'-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[262px] shrink-0 flex-col border-r border-cyan-400/15 bg-[#03101c]/94 shadow-[24px_0_70px_rgba(0,0,0,.32)] backdrop-blur-2xl transition-transform lg:static lg:translate-x-0`}>
    <div className="flex min-h-[72px] items-center justify-between border-b border-cyan-400/12 px-4">
      <img src="/blockctrl-logo.png" alt="BLOCKCTRL Sunucu Yönetim Paneli" className="h-[42px] w-auto max-w-[186px] object-contain object-left"/>
      <Button size="icon" variant="ghost" className="border border-cyan-400/10 bg-white/[.025] lg:hidden" onClick={onClose}><X className="size-4"/></Button>
    </div>

    <div className="mx-3 mt-4 overflow-hidden rounded-2xl border border-cyan-400/18 bg-[linear-gradient(145deg,rgba(10,35,56,.78),rgba(4,17,30,.84))] shadow-[0_14px_38px_rgba(0,0,0,.18)]">
      <div className="flex items-center gap-3 p-3.5">
        {coverUrl?<img src={coverUrl} alt="" className="size-12 rounded-xl border border-white/10 object-cover"/>:<div className="grid size-12 place-items-center rounded-xl border border-cyan-400/15 bg-cyan-400/[.07] text-cyan-300"><ServerIcon className="size-5"/></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{serverName}</p>
          <p className="mt-1 truncate text-[10px] text-slate-500">{serverMeta}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${processState==='ok'?'bg-emerald-400 shadow-[0_0_9px_#34d399]':processState==='bad'?'bg-red-400':processState==='warn'?'bg-amber-400':'bg-slate-500'}`}/>
            <span className={`text-[10px] font-medium ${processState==='ok'?'text-emerald-300':processState==='bad'?'text-red-300':processState==='warn'?'text-amber-300':'text-slate-500'}`}>{processStatusLabel}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-cyan-400/10 bg-black/10">
        <div className="border-r border-cyan-400/10 px-3 py-2.5"><p className="text-[9px] uppercase tracking-[.16em] text-slate-600">Node</p><p className={`mt-1 text-[11px] font-medium ${heartbeatHealthy?'text-cyan-300':'text-amber-300'}`}>{heartbeatHealthy?'Bağlı':'Kontrol gerekli'}</p></div>
        <div className="px-3 py-2.5"><p className="text-[9px] uppercase tracking-[.16em] text-slate-600">Disk</p><p className="mt-1 text-[11px] font-medium text-slate-300">{onlineNode?`%${Math.max(0,Math.min(100,diskPct))}`:'—'}</p></div>
      </div>
    </div>

    <nav className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 pb-4" aria-label="Sunucu yönetimi">
      {GROUPS.map(group=>{
        const rows=group.keys.map(key=>itemMap.get(key)).filter(Boolean) as ServerNavItem[]
        if(!rows.length)return null
        return <div key={group.label}>
          <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[.20em] text-slate-600">{group.label}</p>
          <div className="space-y-1">{rows.map(([key,label,Icon])=><button key={key} aria-current={active===key?'page':undefined} onClick={()=>onSelect(key)} className={`group flex min-h-10 w-full items-center gap-3 rounded-xl border px-3 text-left text-[12px] font-medium transition ${active===key?'border-cyan-400/35 bg-[linear-gradient(90deg,rgba(14,165,233,.20),rgba(6,182,212,.08))] text-white shadow-[inset_3px_0_0_#22d3ee,0_8px_24px_rgba(0,0,0,.12)]':'border-transparent text-slate-400 hover:border-cyan-400/10 hover:bg-white/[.025] hover:text-slate-100'}`}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${active===key?'bg-cyan-400/10 text-cyan-300':'bg-white/[.025] text-slate-500 group-hover:text-cyan-300'}`}><Icon className="size-3.5"/></span><span className="truncate">{label}</span>{active===key&&<span className="ml-auto size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]"/>}</button>)}</div>
        </div>
      })}
    </nav>

    <div className="border-t border-cyan-400/10 p-3">
      <button onClick={onBack} className="flex min-h-10 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-xs font-medium text-slate-400 transition hover:border-cyan-400/10 hover:bg-white/[.025] hover:text-white"><ArrowLeft className="size-4 text-slate-500"/>Sunucu listesine dön</button>
    </div>
  </aside>
}
