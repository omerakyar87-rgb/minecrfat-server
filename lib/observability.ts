type Level='info'|'warning'|'error'|'fatal'
type EventInput={level:Level;event:string;message:string;serverId?:string|null;requestId?:string|null;details?:Record<string,unknown>}

const recent=new Map<string,number>()

function safeDetails(details:Record<string,unknown>|undefined){
  if(!details)return undefined
  const out:Record<string,unknown>={}
  for(const [key,value] of Object.entries(details)){
    if(/token|secret|password|authorization|cookie|private.?key/i.test(key)){out[key]='[redacted]';continue}
    out[key]=value
  }
  return out
}

export function operationalEvent(input:EventInput){
  const payload={source:'blockctrl',at:new Date().toISOString(),...input,details:safeDetails(input.details)}
  const line=JSON.stringify(payload)
  if(input.level==='fatal'||input.level==='error')console.error(line)
  else if(input.level==='warning')console.warn(line)
  else console.info(line)
  return payload
}

export async function operationalAlert(input:EventInput & {dedupeKey?:string;dedupeMs?:number}){
  const payload=operationalEvent(input)
  const url=String(process.env.BLOCKCTRL_ALERT_WEBHOOK_URL||'').trim()
  if(!url)return {delivered:false,reason:'not-configured',payload}
  const key=input.dedupeKey||input.event
  const now=Date.now(),ttl=Math.max(30_000,input.dedupeMs??300_000),last=recent.get(key)??0
  if(now-last<ttl)return {delivered:false,reason:'deduped',payload}
  recent.set(key,now)
  try{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(5000),cache:'no-store'})
    if(!response.ok)throw new Error(`HTTP ${response.status}`)
    return {delivered:true,payload}
  }catch(error){
    operationalEvent({level:'error',event:'observability.webhook.failed',message:error instanceof Error?error.message:'Alert webhook failed'})
    return {delivered:false,reason:'delivery-failed',payload}
  }
}
