var path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const utilsDir = path.dirname(__filename)
const providerInfoPath = path.resolve(utilsDir, '../provider_info.yaml')
const schemaPath = path.resolve(utilsDir, '../schema.yaml')

function loadProviderInfo () {
  let providerInfo
  try {
    providerInfo = yaml.safeLoad(fs.readFileSync(providerInfoPath, 'utf8'))
  } catch (error) {
    providerInfo = {}
  }

  const {
    PROOF_FORM_ID,
    PROOF_FORM_PROVIDER,
    PROOF_FORM_PROVIDER_ID,
  } = process.env

  return {
    provider: PROOF_FORM_PROVIDER || providerInfo.provider || 'proof',
    providerIdentifier:
      PROOF_FORM_PROVIDER_ID ||
      providerInfo.providerIdentifier ||
      `proof/form-example/${Date.now()}`,
    id: PROOF_FORM_ID || providerInfo.id || null,
  }
}

function saveProviderInfo ({ provider, providerIdentifier, id }) {
  try {
    fs.writeFileSync(
      providerInfoPath,
      yaml.safeDump({ provider, providerIdentifier, id }),
      'utf8'
    )
  } catch (error) {
    console.log('error =', error)
  }
}

function loadSchema () {
  try {
    return yaml.safeLoad(fs.readFileSync(schemaPath, 'utf8'))
  } catch (error) {
    console.log(error)
  }
}

function selectRequestLibrary () {
  const { PROOF_URL } = process.env
  const { protocol } = url.parse(PROOF_URL)
  return protocol === 'https:' ? require('https') : require('http')
}

module.exports = {
  loadProviderInfo,
  saveProviderInfo,
  loadSchema,
  requester: selectRequestLibrary(),
}
