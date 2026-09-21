'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Box, Headphones, Menu, Paintbrush, Server, X } from 'lucide-react'
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

  return <div className="relative min-h-svh overflow-x-hidden bg-[#020b16] font-sans text-slate-100">
    <div className="pointer-events-none fixed inset-0 bg-[url('/blockctrl-panel-background.jpg')] bg-cover bg-center bg-no-repeat"/>
    <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(2,14,28,.55),rgba(1,10,21,.68)),radial-gradient(circle_at_70%_15%,rgba(0,153,255,.08),transparent_34%)]"/>

    <aside className={cn('fixed inset-y-0 left-0 z-30 flex w-[278px] flex-col border-r border-sky-400/20 bg-[#03111e]/82 shadow-[20px_0_80px_rgba(0,0,0,.28)] backdrop-blur-[7px] transition-transform lg:translate-x-0',mobileOpen?'translate-x-0':'-translate-x-full')}>
      <div className="flex h-[66px] items-center justify-between border-b border-sky-400/15 px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/40 bg-[#03233d]/80 text-cyan-300 shadow-[0_0_24px_rgba(14,165,233,.25)]"><Box className="size-6"/></span>
          <span><strong className="block text-[20px] font-black tracking-[-.03em] text-white">BLOCK<span className="text-cyan-400">CTRL</span></strong><span className="block text-[10px] tracking-[.18em] text-sky-200/60">CANLI SUNUCU PANELİ</span></span>
        </div>
        <Button variant="ghost" size="icon" className="text-sky-100 lg:hidden" onClick={()=>setMobileOpen(false)}><X/></Button>
      </div>

      <nav className="flex flex-1 flex-col p-3">
        <button type="button" className="mt-7 flex items-center gap-3 rounded-xl border border-cyan-300/55 bg-[linear-gradient(90deg,rgba(0,174,255,.22),rgba(0,91,180,.14))] px-5 py-4 text-left text-[15px] font-medium text-white shadow-[inset_5px_0_0_#22d3ee,0_0_28px_rgba(14,165,233,.12)]">
          <Server className="size-5 text-cyan-200"/>Sunucu operasyonları
        </button>
        <div className="mt-auto px-3 pb-7">
          <div className="mb-3 h-px w-8 bg-cyan-400"/>
          <p className="text-[10px] uppercase leading-5 tracking-[.26em] text-sky-200/60">Sunucular<br/>daha fazlasını başarır</p>
        </div>
      </nav>
    </aside>

    <div className="relative lg:pl-[278px]">
      <header className="sticky top-0 z-20 flex h-[66px] items-center border-b border-sky-400/18 bg-[#020d19]/72 px-4 backdrop-blur-[8px] md:px-7">
        <Button variant="ghost" size="icon" className="text-sky-100 lg:hidden" onClick={()=>setMobileOpen(true)}><Menu/></Button>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="mr-2 hidden items-center gap-2 text-xs text-sky-100/70 sm:flex"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"/>Panel çevrimiçi</div>
          <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-100 hover:bg-white/[.06]" aria-label="Bildirimler"><Bell className="size-5"/></Button>
          <SupportCenter/>
          {role!=='member'&&<Button variant="ghost" size="icon" onClick={()=>setUtilityOpen(true)} aria-label="Yönetim menüsünü aç" title="Yönetim" className="size-10 rounded-xl text-cyan-300 hover:bg-cyan-400/10"><Box className="size-5"/></Button>}
        </div>
      </header>

      <main className="relative min-h-[calc(100svh-66px)] px-4 py-8 md:px-7 lg:px-12 lg:py-11"><InfrastructureManager/></main>
    </div>

    {utilityOpen&&<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="BlockCtrl yönetim menüsü">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setUtilityOpen(false)} aria-label="Menüyü kapat"/>
      <aside className="absolute right-0 top-0 h-full w-full max-w-[620px] overflow-y-auto border-l border-sky-400/25 bg-[#03111e]/96 p-6 shadow-[-30px_0_100px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-9">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300"><Box className="size-8"/></span><div><h2 className="text-3xl font-black tracking-tight">Block<span className="text-cyan-400">Ctrl</span></h2><p className="text-xs uppercase tracking-[.18em] text-sky-200/50">Minecraft sunucu yönetim paneli</p></div></div>
          <Button variant="ghost" size="icon" onClick={()=>setUtilityOpen(false)}><X/></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(item=>{const Icon=item.icon;return <button key={item.key} type="button" onClick={()=>openTool(item.key)} className={cn('group min-h-56 rounded-2xl border p-6 text-left transition hover:-translate-y-1',
            item.tone==='emerald'&&'border-emerald-400/30 bg-gradient-to-br from-emerald-500/30 to-emerald-700/12',
            item.tone==='blue'&&'border-sky-400/30 bg-gradient-to-br from-sky-500/30 to-blue-700/12',
            item.tone==='violet'&&'border-violet-400/30 bg-gradient-to-br from-violet-500/30 to-violet-700/12',
            item.tone==='orange'&&'border-orange-400/30 bg-gradient-to-br from-orange-500/30 to-orange-700/12'
          )}><Icon className="size-12 text-white/90"/><div className="mt-12 flex items-end justify-between gap-4"><div><strong className="block text-2xl leading-tight text-white">{item.title}</strong><span className="mt-2 block text-sm text-white/65">{item.description}</span></div><span className="text-4xl leading-none text-white">→</span></div></button>})}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-sky-400/10 pt-6 text-[10px] uppercase tracking-[.26em] text-sky-200/40"><span>Kendi dünyanı yönet</span><span>BlockCtrl.com</span></div>
      </aside>
    </div>}
  </div>
}
