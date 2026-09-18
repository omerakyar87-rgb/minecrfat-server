import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'


export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


const EXPECTED_MIGRATION = '0014_server_website_data'


type CheckStatus='unknown'|'ok'|'error'|'outdated'|'offline'|'not-configured'
function errorMessage(error:unknown,fallback:string){return error instanceof Error?error.message:fallback}
function markDegraded(health:{status:'ok'|'degraded'|'error'}){if(health.status==='ok')health.status='degraded'}


export async function GET() {
  const startedAt=Date.now()
  const health={
    service:'blockctrl-panel',
    status:'ok' as 'ok'|'degraded'|'error',
    timestamp:new Date().toISOString(),
    responseTimeMs:0,
    database:{status:'unknown' as CheckStatus,latencyMs:null as number|null,error:null as string|null,pool:{total:0,idle:0,waiting:0,max:Number(process.env.PG_POOL_MAX||10)}},
    migration:{status:'unknown' as CheckStatus,expected:EXPECTED_MIGRATION,latest:null as string|null,error:null as string|null},
    agent:{status:'unknown' as CheckStatus,totalNodes:0,onlineNodes:0,latestHeartbeat:null as string|null,error:null as string|null},
    vercelWebsite:{status:'unknown' as CheckStatus,latencyMs:null as number|null,teamConfigured:false,error:null as string|null},
    blobStorage:{status:'unknown' as CheckStatus,latencyMs:null as number|null,error:null as string|null},
    websiteRuntime:{status:'unknown' as CheckStatus,publicUrlConfigured:false,serverBridgeConfigured:false,error:null as string|null},
    integrations:{status:'unknown' as CheckStatus,discordWebhook:true,discordBotWorker:false,liveStreamGateway:false,encryptionConfigured:false,oauth:{youtube:false,twitch:false,kick:false},error:null as string|null},
  }


  try{
    const dbStarted=Date.now()
    await pool.query('SELECT 1')
    health.database.status='ok';health.database.latencyMs=Date.now()-dbStarted;health.database.error=null;health.database.pool={total:pool.totalCount,idle:pool.idleCount,waiting:pool.waitingCount,max:Number(process.env.PG_POOL_MAX||10)}
  }catch(error){
    health.database.status='error';health.database.latencyMs=null;health.database.error=errorMessage(error,'Database connection failed');health.database.pool={total:pool.totalCount,idle:pool.idleCount,waiting:pool.waitingCount,max:Number(process.env.PG_POOL_MAX||10)}
    health.status='error'
  }


  if(health.database.status==='ok'){
    try{
      const migration=await pool.query<{version:string}>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1')
      const latest=String(migration.rows[0]?.version||'')
      health.migration.latest=latest||null
      health.migration.status=latest>=EXPECTED_MIGRATION?'ok':'outdated'
      if(health.migration.status!=='ok')health.status='error'
    }catch(error){
      health.migration.status='error'
      health.migration.error=errorMessage(error,'Migration status unavailable')
      health.status='error'
    }


    try{
      const agent=await pool.query<{total:string;online:string;latest:Date|null}>(`SELECT count(*)::text AS total,count(*) FILTER (WHERE "lastHeartbeat">=now()-interval '90 seconds')::text AS online,max("lastHeartbeat") AS latest FROM nodes`)
      const row=agent.rows[0]
      health.agent.totalNodes=Number(row?.total||0)
      health.agent.onlineNodes=Number(row?.online||0)
      health.agent.latestHeartbeat=row?.latest?new Date(row.latest).toISOString():null
      health.agent.status=health.agent.totalNodes===0?'not-configured':health.agent.onlineNodes>0?'ok':'offline'
      if(health.agent.status==='offline')markDegraded(health)
    }catch(error){
      health.agent.status='error'
      health.agent.error=errorMessage(error,'Agent status unavailable')
      markDegraded(health)
    }
  }


  const vercelToken=process.env.VERCEL_TOKEN||''
  const teamId=process.env.VERCEL_TEAM_ID||process.env.VERCEL_ORG_ID||''
  const teamSlug=process.env.VERCEL_TEAM_SLUG||''
  health.vercelWebsite.teamConfigured=Boolean(teamId||teamSlug)
  if(!vercelToken){
    health.vercelWebsite.status='not-configured'
    health.vercelWebsite.error='VERCEL_TOKEN is not configured'
    markDegraded(health)
  }else{
    try{
      const vercelStarted=Date.now()
      const query=new URLSearchParams({limit:'1'})
      if(teamId)query.set('teamId',teamId)
      else if(teamSlug)query.set('slug',teamSlug)
      const response=await fetch(`https://api.vercel.com/v6/deployments?${query.toString()}`,{headers:{authorization:`Bearer ${vercelToken}`},cache:'no-store',signal:AbortSignal.timeout(5000)})
      health.vercelWebsite.latencyMs=Date.now()-vercelStarted
      if(!response.ok)throw new Error(`Vercel API returned HTTP ${response.status}`)
      await response.json()
      health.vercelWebsite.status='ok'
    }catch(error){
      health.vercelWebsite.status='error'
      health.vercelWebsite.error=errorMessage(error,'Vercel website integration unavailable')
      markDegraded(health)
    }
  }


  const blobToken=process.env.BLOB_READ_WRITE_TOKEN||''
  if(!blobToken){
    health.blobStorage.status='not-configured'
    health.blobStorage.error='BLOB_READ_WRITE_TOKEN is not configured'
    markDegraded(health)
  }else{
    try{
      const blobStarted=Date.now()
      await list({limit:1,token:blobToken})
      health.blobStorage.latencyMs=Date.now()-blobStarted
      health.blobStorage.status='ok'
    }catch(error){
      health.blobStorage.status='error'
      health.blobStorage.error=errorMessage(error,'Blob storage unavailable')
      markDegraded(health)
    }
  }


  const publicUrl=String(process.env.BLOCKCTRL_PUBLIC_URL||process.env.NEXT_PUBLIC_APP_URL||'').trim()
  const serverBridgeKey=String(process.env.BLOCKCTRL_SITE_SERVER_BRIDGE_KEY||'').trim()
  health.websiteRuntime.publicUrlConfigured=/^https:\/\//i.test(publicUrl)
  health.websiteRuntime.serverBridgeConfigured=serverBridgeKey.length>=24
  if(health.websiteRuntime.publicUrlConfigured&&health.websiteRuntime.serverBridgeConfigured){
    health.websiteRuntime.status='ok'
  }else{
    health.websiteRuntime.status='not-configured'
    const missing=[] as string[]
    if(!health.websiteRuntime.publicUrlConfigured)missing.push('BLOCKCTRL_PUBLIC_URL (HTTPS)')
    if(!health.websiteRuntime.serverBridgeConfigured)missing.push('BLOCKCTRL_SITE_SERVER_BRIDGE_KEY')
    health.websiteRuntime.error=`Eksik website runtime ayarı: ${missing.join(', ')}`
    markDegraded(health)
  }


  health.integrations.discordBotWorker=Boolean(process.env.DISCORD_BOT_WORKER_URL)
  health.integrations.liveStreamGateway=Boolean(process.env.LIVE_STREAM_GATEWAY_URL)
  health.integrations.encryptionConfigured=String(process.env.INTEGRATION_ENCRYPTION_KEY||'').length>=24
  health.integrations.oauth={
    youtube:Boolean(process.env.YOUTUBE_CLIENT_ID&&process.env.YOUTUBE_CLIENT_SECRET),
    twitch:Boolean(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET),
    kick:Boolean(process.env.KICK_CLIENT_ID&&process.env.KICK_CLIENT_SECRET),
  }
  const optionalIntegrationReady=health.integrations.discordBotWorker||health.integrations.liveStreamGateway||Object.values(health.integrations.oauth).some(Boolean)
  if(health.integrations.encryptionConfigured){
    health.integrations.status=optionalIntegrationReady?'ok':'not-configured'
    if(!optionalIntegrationReady)health.integrations.error='Opsiyonel bot/gateway/OAuth entegrasyonları henüz yapılandırılmadı.'
  }else{
    health.integrations.status='not-configured'
    health.integrations.error='INTEGRATION_ENCRYPTION_KEY yapılandırılmadı; secret kullanan entegrasyonlar güvenle etkinleştirilemez.'
    markDegraded(health)
  }

  health.responseTimeMs=Date.now()-startedAt
  return NextResponse.json(health,{status:health.status==='error'?503:200,headers:{'Cache-Control':'no-store, max-age=0'}})
}