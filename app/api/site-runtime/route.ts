import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db, ensurePanelSchema } from '@/lib/db'
import { lostItems, serverMetrics, serverPermissions, serverSettings, servers, websites } from '@/lib/db/schema'

const ALLOWED=new Set(['server-status','players','metrics','lost-items','leaderboard-kills','leaderboard-money','leaderboard-health','bans'])
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Cache-Control':'public, max-age=5, stale-while-revalidate=15'}
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:cors})}
export function OPTIONS(){return new NextResponse(null,{status:204,headers:cors})}
function referencedServerIds(data:unknown){const ids=new Set<string>();if(!data||typeof data!=='object')return ids;const pages=Array.isArray((data as any).pages)?(data as any).pages:[];for(const page of pages){for(const section of Array.isArray(page?.sections)?page.sections:[]){const id=String(section?.liveData?.serverId||'');if(id)ids.add(id)}}return ids}

export async function GET(request:NextRequest){
  await ensurePanelSchema()
  const siteSlug=String(request.nextUrl.searchParams.get('site')||'')
  const source=String(request.nextUrl.searchParams.get('source')||'')
  const serverId=String(request.nextUrl.searchParams.get('serverId')||'')
  if(!siteSlug||!ALLOWED.has(source))return response({error:'Geçersiz canlı veri isteği.'},400)
  const site=(await db.select().from(websites).where(eq(websites.slug,siteSlug)).limit(1))[0]
  if(!site)return response({error:'Website bulunamadı.'},404)
  if(!serverId)return response({available:false,source,reason:'Sunucu seçilmedi.',items:[]})
  const configured=referencedServerIds(site.builderData)
  if(!configured.has(serverId))return response({error:'Bu sunucu website canlı verisine bağlı değil.'},403)
  const server=(await db.select().from(servers).where(eq(servers.id,serverId)).limit(1))[0]
  if(!server)return response({available:false,source,reason:'Sunucu bulunamadı.',items:[]})
  if(server.userId!==site.userId){
    const grant=(await db.select({id:serverPermissions.id,canWebsiteData:serverPermissions.canWebsiteData}).from(serverPermissions).where(and(eq(serverPermissions.userId,site.userId),eq(serverPermissions.serverId,server.id),eq(serverPermissions.canWebsiteData,true))).limit(1))[0]
    if(!grant)return response({error:'Website sahibi bu sunucunun public website verisini yayınlama yetkisine sahip değil.'},403)
  }
  const metric=(await db.select().from(serverMetrics).where(eq(serverMetrics.serverId,server.id)).orderBy(desc(serverMetrics.createdAt)).limit(1))[0]
  const settings=(await db.select().from(serverSettings).where(eq(serverSettings.serverId,server.id)).limit(1))[0]
  const raw=(settings?.settings||{}) as Record<string,unknown>
  const hostname=String(raw.hostname||raw.srvRecord||'').trim()
  const metricAt=metric?.createdAt?new Date(metric.createdAt):null
  const telemetryFresh=Boolean(metricAt&&Date.now()-metricAt.getTime()<=120_000)
  const summary={serverId:server.id,name:server.name,status:server.status,online:server.status==='running',players:telemetryFresh?(metric?.players??server.playerCount):server.playerCount,version:server.mcVersion,loader:server.loader,port:server.port,address:hostname||null,tps:telemetryFresh?(metric?.tps??null):null,mspt:telemetryFresh?(metric?.mspt??null):null,cpuPercent:telemetryFresh?(metric?.cpuPercent??null):null,memoryUsedMb:telemetryFresh?(metric?.memoryUsedMb??null):null,memoryTotalMb:telemetryFresh?(metric?.memoryTotalMb??server.memoryMb):server.memoryMb,uptimeSeconds:telemetryFresh?(metric?.uptimeSeconds??0):0,telemetryFresh,metricAt:metricAt?.toISOString()??null}
  if(source==='metrics'&&!telemetryFresh)return response({available:false,source,reason:'Sunucu telemetrisi güncel değil. Agent yeni metric göndermedi.',updatedAt:metricAt?.toISOString()??null,summary,items:[]})
  if(source==='server-status'||source==='players'||source==='metrics')return response({available:true,source,updatedAt:metricAt?.toISOString()??null,summary,items:[
    {title:'Çevrimiçi Oyuncu',description:server.name,value:String(summary.players)},
    {title:'Sunucu Durumu',description:`${server.loader} ${server.mcVersion}`,value:summary.online?'Çalışıyor':'Kapalı'},
    {title:'TPS',description:telemetryFresh?'Son telemetri':'Telemetri güncel değil',value:summary.tps==null?'—':String(summary.tps)},
    {title:'Uptime',description:telemetryFresh?'Çalışma süresi':'Telemetri güncel değil',value:summary.uptimeSeconds?`${Math.floor(summary.uptimeSeconds/3600)} sa`:'—'},
  ]})
  if(source==='lost-items'){
    if(!server.itemTrackingEnabled)return response({available:false,source,reason:'Kayıp eşya takibi bu sunucuda etkin değil.',summary,items:[]})
    const rows=await db.select().from(lostItems).where(eq(lostItems.serverId,server.id)).orderBy(desc(lostItems.occurredAt)).limit(12)
    return response({available:true,source,updatedAt:new Date().toISOString(),summary,items:rows.map(row=>({title:row.playerName||'Oyuncu',description:`${row.itemName} x${row.amount} · ${row.reason}`,value:row.status,image:null}))})
  }
  return response({available:false,source,reason:'Bu veri türü için henüz canlı plugin/veri sağlayıcısı bağlı değil.',summary,items:[]})
}