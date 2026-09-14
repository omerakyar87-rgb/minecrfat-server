'use client'

import { useEffect, useState } from 'react'
import { Box, FileText, Headphones, Info, Menu, Server, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfrastructureManager } from '@/components/infrastructure-manager'
import { SupportCenter } from '@/components/support-center'
import { cn } from '@/lib/utils'

const cards = [
  {key:'worlds', title:'Dünyalar', description:'Dünya türlerini ayarla ve yeni dünyalar oluştur.', icon:Box, tone:'cyan'},
  {key:'info', title:'Bilgilendirme', description:'Sunucu rehberlerini, metinleri ve ekleri görüntüle.', icon:Info, tone:'violet'},
  {key:'support', title:'Destekler', description:'Destek taleplerini ve sohbetleri yönet.', icon:Headphones, tone:'amber'},
] as const

export function ControlPanel() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [activeCard, setActiveCard] = useState<string|null>(null)
  const [role, setRole] = useState<'manager'|'admin'|'guide'|'member'>('member')
  useEffect(()=>{const handler=(event:Event)=>{const next=(event as CustomEvent<{role?:string}>).detail?.role;if(next==='manager'||next==='admin'||next==='guide'||next==='member')setRole(next)};window.addEventListener('blockctrl:role',handler);return()=>window.removeEventListener('blockctrl:role',handler)},[])
  const visibleCards = cards.filter(card => {
    if (role === 'manager') return true
    if (role === 'admin' || role === 'guide') return card.key !== 'worlds'
    return card.key === 'worlds'
  })
  function openCard(key:string){
    setActiveCard(key)
    if(key==='info'||key==='support') window.dispatchEvent(new CustomEvent('blockctrl:open-support',{detail:{view:key==='info'?'info':'home'}}))
    if(key==='worlds') document.getElementById('worlds')?.scrollIntoView({behavior:'smooth',block:'start'})
  }
  return <div className="min-h-svh bg-[#020805] font-sans text-foreground">
    <aside className={cn('fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-emerald-950/70 bg-[#03100a] transition-transform lg:translate-x-0',mobileOpen?'translate-x-0':'-translate-x-full')}>
      <div className="flex h-16 items-center justify-between border-b border-emerald-950/70 px-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-400 text-[#03100a] shadow-[0_0_24px_rgba(74,222,128,.35)]"><Box className="size-5"/></span><span><strong className="block text-sm tracking-wide text-emerald-50">BLOCKCTRL</strong><span className="block text-[10px] tracking-[.18em] text-emerald-200/60">SUNUCU PANELİ</span></span></div><Button variant="ghost" size="icon" className="text-emerald-100 lg:hidden" onClick={()=>setMobileOpen(false)} aria-label="Menüyü kapat"><X/></Button></div>
      <nav className="flex flex-1 flex-col gap-2 p-3" aria-label="Ana navigasyon"><div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-3 text-sm font-medium text-emerald-100"><Server className="size-4 text-emerald-300"/>Sunucu operasyonları</div></nav>
      <div className="border-t border-emerald-950/70 p-4"><div className="flex items-center gap-3 text-sm text-emerald-100/60"><ShieldCheck className="size-4 text-emerald-300"/><span>Oturum ve izin korumalı</span></div></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center border-b border-emerald-950/70 bg-[#020805]/90 px-4 backdrop-blur-xl md:px-6"><Button variant="ghost" size="icon" className="text-emerald-100 lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Menüyü aç"><Menu/></Button><div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 text-xs text-emerald-100/60 sm:flex"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#4ade80]"/>Panel çevrimiçi</div>{role!=='member'&&<Button onClick={()=>setUtilityOpen(true)} aria-label="Yönetim araçlarını aç" className="gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-emerald-100 shadow-[0_0_24px_rgba(74,222,128,.12)] hover:bg-emerald-400/20"><Box className="size-4"/>Yönetim</Button>}<SupportCenter/></div></header><main id="worlds" className="p-4 md:p-6 lg:p-8"><InfrastructureManager/></main></div>
    {utilityOpen&&<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Yardım paneli"><button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setUtilityOpen(false)} aria-label="Paneli kapat"/><aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-emerald-400/20 bg-[#03100a] p-6 shadow-[-20px_0_80px_rgba(0,0,0,.55)]"><div className="mb-8 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.22em] text-emerald-300/70">BLOCKCTRL</p><h2 className="mt-1 text-2xl font-semibold text-emerald-50">Yardım merkezi</h2></div><Button variant="ghost" size="icon" className="text-emerald-100" onClick={()=>setUtilityOpen(false)} aria-label="Kapat"><X/></Button></div><div className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100/70">Rol: <strong className="text-emerald-100">{role==='manager'?'Yönetici':role==='admin'?'Admin':role==='guide'?'Rehber':'Üye'}</strong>{role==='member'&&<span> · Yönetim araçları yalnız yetkili hesaplara açıktır.</span>}{(role==='admin'||role==='guide')&&<span> · Destek ve rehber araçları etkin.</span>}</div><div className="space-y-4">{visibleCards.map(card=>{const Icon=card.icon;return <button key={card.key} type="button" onClick={()=>{openCard(card.key);if(card.key!=='worlds')setUtilityOpen(false)}} className={cn('group w-full rounded-2xl border p-5 text-left transition hover:-translate-y-0.5',card.tone==='cyan'&&'border-cyan-400/70 bg-cyan-400/10 hover:bg-cyan-400/15',card.tone==='violet'&&'border-violet-400/70 bg-violet-400/10 hover:bg-violet-400/15',card.tone==='amber'&&'border-amber-400/70 bg-amber-400/10 hover:bg-amber-400/15',activeCard===card.key&&'ring-2 ring-white/30')}><span className="mb-5 grid size-14 place-items-center rounded-2xl bg-black/15"><Icon className="size-8"/></span><div className="flex items-end justify-between gap-4"><span><strong className="block text-xl text-white">{card.title}</strong><span className="mt-1 block text-sm text-white/65">{card.description}</span></span><span className="text-2xl text-white/70">→</span></div></button>})}</div><div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-100/65"><FileText className="mb-2 size-5 text-emerald-300"/><p>Bilgilendirme alanından yazı, görsel ve PDF rehberlerini düzenleyebilir; destek taleplerinden gelen görüşmeleri takip edebilirsiniz.</p></div></aside></div>}
  </div>
}
