import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request:NextRequest){
  const type=request.headers.get('content-type')||''
  if(!type.includes('application/csp-report')&&!type.includes('application/reports+json')&&!type.includes('application/json'))return new NextResponse(null,{status:204})
  const raw=await request.text().catch(()=> '')
  if(raw.length>16_384)return new NextResponse(null,{status:413})
  try{
    const payload=JSON.parse(raw||'{}')
    const report=Array.isArray(payload)?payload[0]:payload
    const body=report?.['csp-report']??report?.body??report
    console.warn('[csp-report]',JSON.stringify({
      documentUri:String(body?.['document-uri']??body?.documentURL??'').slice(0,500),
      violatedDirective:String(body?.['violated-directive']??body?.effectiveDirective??'').slice(0,160),
      blockedUri:String(body?.['blocked-uri']??body?.blockedURL??'').slice(0,500),
      sourceFile:String(body?.['source-file']??body?.sourceFile??'').slice(0,500),
      lineNumber:Number(body?.['line-number']??body?.lineNumber??0)||undefined,
    }))
  }catch{}
  return new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}})
}
