import { createClient } from '@/lib/supabase/server'

export const auth = {
  api: {
    async getSession(_options?: unknown) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      return { user: { id: user.id, email: user.email ?? '', name: user.user_metadata?.name ?? user.email ?? '' } }
    },
    async getMfaStatus() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const [aalResult,factorResult]=await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ])
      if(aalResult.error)throw aalResult.error
      if(factorResult.error)throw factorResult.error
      const factorData=factorResult.data as any
      const factors=Array.isArray(factorData?.all)
        ? factorData.all
        : [...(Array.isArray(factorData?.totp)?factorData.totp:[]),...(Array.isArray(factorData?.phone)?factorData.phone:[])]
      const verified=factors.filter((factor:any)=>String(factor?.status||'')==='verified')
      return {
        currentLevel:aalResult.data?.currentLevel??null,
        nextLevel:aalResult.data?.nextLevel??null,
        verifiedFactors:verified.length,
        factors:verified.map((factor:any)=>({id:String(factor.id||''),type:String(factor.factor_type||factor.type||'unknown'),friendlyName:String(factor.friendly_name||factor.friendlyName||'')})),
      }
    },
  },
}
