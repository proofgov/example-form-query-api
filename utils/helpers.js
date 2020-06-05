const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const url = require('url')
const yaml = require('js-yaml')

const utilsDir = path.dirname(__filename)
const providerInfoPath = path.resolve(utilsDir, '../provider_info.yaml')
const schemaPath = path.resolve(utilsDir, '../schema.yaml')

const { PROOF_URL } = process.env
const { protocol, hostname, port } = url.parse(PROOF_URL)

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
    PROOF_FORM_PROVIDER_IDENTIFIER,
  } = process.env

  return {
    provider: PROOF_FORM_PROVIDER || providerInfo.provider || 'proof',
    providerIdentifier:
      PROOF_FORM_PROVIDER_IDENTIFIER ||
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
  return protocol === 'https:' ? https : http
}

module.exports = {
  loadProviderInfo,
  saveProviderInfo,
  loadSchema,
  requester: selectRequestLibrary(),
  protocol,
  hostname,
  port,
}
