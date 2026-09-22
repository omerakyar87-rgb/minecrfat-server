'use client'

import { Bell, Menu, MessageCircle, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return <header className="sticky top-0 z-30 border-b border-cyan-400/15 bg-[#03101c]/88 shadow-[0_12px_40px_rgba(0,0,0,.18)] backdrop-blur-2xl">
    <div className="flex min-h-[72px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button size="icon" variant="ghost" className="shrink-0 border border-cyan-400/10 bg-white/[.025] text-slate-200 hover:bg-cyan-400/10 lg:hidden" onClick={onOpenMenu} aria-label="Sunucu menüsünü aç"><Menu className="size-5"/></Button>
        <div className="hidden size-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/[.07] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,.08)] sm:grid"><Server className="size-5"/></div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>Sunucular</span><span className="text-cyan-400/45">/</span><span className="truncate text-slate-400">{serverName}</span><span className="hidden text-cyan-400/45 sm:inline">/</span><span className="hidden truncate text-cyan-300 sm:inline">{sectionLabel}</span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold tracking-tight text-white sm:text-[15px]">{sectionLabel}</h1>
            <span className="hidden rounded-full border border-cyan-400/15 bg-cyan-400/[.05] px-2 py-0.5 text-[10px] font-medium text-cyan-200/75 md:inline">BLOCKCTRL SERVER</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button size="icon" variant="ghost" className="rounded-xl border border-cyan-400/10 bg-white/[.025] text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/[.08] hover:text-cyan-200" onClick={()=>window.dispatchEvent(new CustomEvent('blockctrl:open-support',{detail:{view:'announcements'}}))} title="Duyurular" aria-label="Duyurular"><Bell className="size-4"/></Button>
        <Button size="icon" variant="ghost" className="rounded-xl border border-cyan-400/10 bg-white/[.025] text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/[.08] hover:text-cyan-200" onClick={()=>window.dispatchEvent(new CustomEvent('blockctrl:open-support',{detail:{view:'home'}}))} title="Destek ve sohbet" aria-label="Destek ve sohbet"><MessageCircle className="size-4"/></Button>
        <Button size="icon" variant="ghost" className="rounded-xl border border-cyan-400/10 bg-white/[.025] text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/[.08] hover:text-cyan-200" onClick={onRefresh} title="Canlı veriyi yenile" aria-label="Canlı veriyi yenile"><RefreshCw className="size-4"/></Button>
        {actor&&<div className="ml-1 hidden items-center gap-2.5 border-l border-cyan-400/10 pl-3 sm:flex">
          <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-xs font-bold text-cyan-100">{actor.name.slice(0,1).toUpperCase()}</div>
          <div className="hidden leading-tight md:block"><p className="max-w-32 truncate text-xs font-semibold text-white">{actor.name}</p><p className="mt-0.5 text-[10px] capitalize text-slate-500">{actor.role}</p></div>
        </div>}
      </div>
    </div>
  </header>
}
