'use client'

import { useEffect, useState } from 'react'
import { BellRing, Box, Globe2, Headphones, Info, Menu, Paintbrush, Server, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfrastructureManager } from '@/components/infrastructure-manager'
import { SupportCenter } from '@/components/support-center'
import { cn } from '@/lib/utils'

const tools = [
  {key:'worlds', title:'Dünya Ayarları', description:'Dünya ve harita yönetimi', icon:Box, tone:'emerald'},
  {key:'support', title:'Destek Ayarları', description:'Yardım ve destek seçenekleri', icon:Headphones, tone:'blue'},
  {key:'info', title:'Bilgilendirme Ayarları', description:'Duyuru ve bildirim yönetimi', icon:BellRing, tone:'violet'},
  {key:'websites', title:'Website Tasarım Ayarları', description:'Site görünümü ve tema', icon:Paintbrush, tone:'orange'},
] as const

export function ControlPanel() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [role, setRole] = useState<'manager'|'admin'|'guide'|'member'>('member')

  useEffect(()=>{
    const handler=(event:Event)=>{
      const next=(event as CustomEvent<{role?:string}>).detail?.role
      if(next==='manager'||next==='admin'||next==='guide'||next==='member')setRole(next)
    }
    window.addEventListener('blockctrl:role',handler)
    return()=>window.removeEventListener('blockctrl:role',handler)
  },[])

  function openTool(key:(typeof tools)[number]['key']){
    if(key==='worlds') window.dispatchEvent(new CustomEvent('blockctrl:open-world-management'))
    if(key==='websites') window.dispatchEvent(new CustomEvent('blockctrl:open-websites'))
    if(key==='support'||key==='info') window.dispatchEvent(new CustomEvent('blockctrl:open-support',{detail:{view:key==='info'?'info':'home'}}))
    setUtilityOpen(false)
  }

  return <div className="min-h-svh bg-[#020b16] font-sans text-slate-100">
    <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:radial-gradient(circle_at_70%_20%,rgba(14,165,233,.12),transparent_28%),linear-gradient(180deg,rgba(4,24,43,.8),rgba(2,11,22,.95))]"/>
    <aside className={cn('fixed inset-y-0 left-0 z-30 flex w-[278px] flex-col border-r border-sky-400/15 bg-[#03111e]/95 shadow-[20px_0_80px_rgba(0,0,0,.18)] backdrop-blur-xl transition-transform lg:translate-x-0',mobileOpen?'translate-x-0':'-translate-x-full')}>
      <div className="flex h-[66px] items-center justify-between border-b border-sky-400/15 px-5">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(14,165,233,.16)]"><Box className="size-6"/></span><span><strong className="block text-lg tracking-tight text-white">BLOCK<span className="text-cyan-400">CTRL</span></strong><span className="block text-[10px] tracking-[.18em] text-sky-200/55">CANLI SUNUCU PANELİ</span></span></div>
        <Button variant="ghost" size="icon" className="text-sky-100 lg:hidden" onClick={()=>setMobileOpen(false)}><X/></Button>
      </div>
      <nav className="flex flex-1 flex-col p-3">
        <button type="button" className="flex items-center gap-3 rounded-xl border border-cyan-300/50 bg-gradient-to-r from-sky-500/20 to-blue-600/10 px-4 py-3.5 text-left text-sm font-medium text-white shadow-[inset_4px_0_0_#22d3ee,0_0_25px_rgba(14,165,233,.10)]"><Server className="size-5 text-cyan-300"/>Sunucu operasyonları</button>
        <div className="mt-auto px-3 pb-3"><div className="mb-3 h-px w-8 bg-cyan-400"/><p className="text-[10px] uppercase leading-5 tracking-[.25em] text-sky-200/50">Sunucular<br/>daha fazlasını başarır</p></div>
      </nav>
    </aside>

    <div className="relative lg:pl-[278px]">
      <header className="sticky top-0 z-20 flex h-[66px] items-center border-b border-sky-400/15 bg-[#020b16]/90 px-4 backdrop-blur-xl md:px-7">
        <Button variant="ghost" size="icon" className="text-sky-100 lg:hidden" onClick={()=>setMobileOpen(true)}><Menu/></Button>
        <div className="ml-auto flex items-center gap-2">
          <SupportCenter/>
          {role!=='member'&&<Button variant="outline" size="icon" onClick={()=>setUtilityOpen(true)} aria-label="Yönetim menüsünü aç" title="Yönetim" className="size-10 rounded-xl border-sky-300/25 bg-[#071827] text-cyan-200 hover:border-cyan-300/45 hover:bg-cyan-400/10"><Box className="size-5"/></Button>}
          <div className="ml-2 hidden items-center gap-2 text-xs text-sky-100/65 sm:flex"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"/>Panel çevrimiçi</div>
        </div>
      </header>
      <main className="relative p-4 md:p-7 lg:p-12"><InfrastructureManager/></main>
    </div>

    {utilityOpen&&<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="BlockCtrl yönetim menüsü">
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={()=>setUtilityOpen(false)} aria-label="Menüyü kapat"/>
      <aside className="absolute right-0 top-0 h-full w-full max-w-[620px] overflow-y-auto border-l border-sky-400/20 bg-[#03111e] p-6 shadow-[-30px_0_100px_rgba(0,0,0,.6)] sm:p-9">
        <div className="mb-10 flex items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300"><Box className="size-8"/></span><div><h2 className="text-3xl font-black tracking-tight">Block<span className="text-cyan-400">Ctrl</span></h2><p className="text-xs uppercase tracking-[.18em] text-sky-200/50">Minecraft sunucu yönetim paneli</p></div></div><Button variant="ghost" size="icon" onClick={()=>setUtilityOpen(false)}><X/></Button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(item=>{const Icon=item.icon;return <button key={item.key} type="button" onClick={()=>openTool(item.key)} className={cn('group min-h-56 rounded-2xl border p-6 text-left transition hover:-translate-y-1',
            item.tone==='emerald'&&'border-emerald-400/30 bg-gradient-to-br from-emerald-500/25 to-emerald-700/10',
            item.tone==='blue'&&'border-sky-400/30 bg-gradient-to-br from-sky-500/25 to-blue-700/10',
            item.tone==='violet'&&'border-violet-400/30 bg-gradient-to-br from-violet-500/25 to-violet-700/10',
            item.tone==='orange'&&'border-orange-400/30 bg-gradient-to-br from-orange-500/25 to-orange-700/10'
          )}><Icon className="size-12 text-white/90"/><div className="mt-12 flex items-end justify-between gap-4"><div><strong className="block text-2xl leading-tight text-white">{item.title}</strong><span className="mt-2 block text-sm text-white/65">{item.description}</span></div><span className="text-4xl leading-none text-white">→</span></div></button>})}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-sky-400/10 pt-6 text-[10px] uppercase tracking-[.26em] text-sky-200/40"><span>Kendi dünyanı yönet</span><span>BlockCtrl.com</span></div>
      </aside>
    </div>}
  </div>
}
