'use client'

import { Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupportCenter } from '@/components/support-center'

type Actor={name:string;role:string}

export function ServerDetailHeader({
  serverName,sectionLabel,actor,onOpenMenu,onRefresh,
}:{
  serverName:string
  sectionLabel:string
  actor?:Actor|null
  onOpenMenu:()=>void
  onRefresh:()=>void
}){
  return <header className="sticky top-0 z-30 flex min-h-[62px] items-center justify-between gap-2 border-b border-[#18283b] bg-[#081421]/95 px-3 backdrop-blur-xl sm:px-4 lg:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <Button size="icon" variant="ghost" className="shrink-0 lg:hidden" onClick={onOpenMenu} aria-label="Sunucu menüsünü aç"><Menu className="size-5"/></Button>
      <div className="min-w-0"><p className="truncate text-xs text-slate-500">Sunucular <span className="mx-1">›</span> {serverName} <span className="mx-1">›</span> <span className="text-slate-300">{sectionLabel}</span></p></div>
    </div>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <SupportCenter/>
      <Button size="icon" variant="ghost" className="rounded-full" onClick={onRefresh} title="Canlı veriyi yenile" aria-label="Canlı veriyi yenile"><RefreshCw className="size-4"/></Button>
      {actor&&<div className="ml-1 hidden items-center gap-2 border-l border-[#1a2a3d] pl-3 sm:flex"><div className="grid size-8 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white">{actor.name.slice(0,1).toUpperCase()}</div><div className="leading-tight"><p className="max-w-32 truncate text-xs font-medium text-white">{actor.name}</p><p className="text-xs capitalize text-slate-500">{actor.role}</p></div></div>}
    </div>
  </header>
}
