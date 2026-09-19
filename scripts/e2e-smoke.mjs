import assert from 'node:assert/strict'

const base=(process.env.E2E_BASE_URL||'').replace(/\/$/,'')
if(!base) {
  console.log('E2E_BASE_URL tanımlı değil; preview smoke testi atlandı.')
  process.exit(0)
}

const checks=['/','/__blockctrl-e2e-not-found__']
for(const path of checks){
  const response=await fetch(base+path,{redirect:'manual'})
  assert.ok(response.status<500,`${path} sunucu hatası döndürdü: ${response.status}`)
}
console.log('Preview E2E smoke checks passed:',base)
