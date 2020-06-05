// Entry point
const express = require('express')
const basicAuth = require('express-basic-auth')
const path = require('path')

const app = express()
const checkAuthorization = (username, password) => {
  console.log(` > Basic Auth check for '${username}':'${password}'`)
  const userRecord = users[username]
  if (!userRecord) return false
  return userRecord.password === password
}

const listenPort = 4000

const regionLookupRecord = 'destionation.structured'
const allowedFields = Object.freeze([
  regionLookupRecord,
  'entry.purpose',
  'traveller.Identifier',
  'traveller.name',
  'traveller.telephone',
  'traveller.Address',
  'locations.visited14days',
])

currentDir = path.dirname(__filename)
const { users, regions } = require(path.resolve(currentDir, 'config.js'))

const {
  loadProviderInfo,
  saveProviderInfo,
  loadSchema,
  requester,
  protocol,
  hostname,
  port,
} = require(path.resolve(currentDir, 'utils/helpers'))

// DATA PROCESSING PIPELINE
const processData = (data, { regionId }) => {
  // Currently the server is using ILike to match filters; therefore,
  // we need to ensure that drop the other regions.
  let processedData = data.filter((item) => item[regionLookupRecord] == regionId)

  // Only show allowedFields.
  processedData =  processedData.map((item) =>{
    const obj = {}
    allowedFields.forEach((field) => {
      obj[field] = item[field]
    })
    return obj
  })

  return processedData
}

// Used to parse data from Proof's servers
const processServerResponse = (resolve, reject, response, context) => {
  const { statusCode } = response

  let rawData = ''
  response.on('data', chunk => {
    rawData += chunk
  })
  response.on('end', () => {
    let parsedData = {}
    try {
      parsedData = JSON.parse(rawData)
    } catch (error) {
      return reject(error, rawData)
    }

    switch (statusCode) {
      case 200:
        // The server returns data and meta, records are held in the `data` field.
        // Each record holds the submission in it's `data` field.
        //
        // Structure Example:
        // {
        //   data: [
        //     {
        //       id: 1,
        //       data: { firstName: 'Bob' }
        //     },
        //     {
        //       id: 2,
        //       data: { firstName: 'Sam' }
        //     },
        //   ],
        //   mata: { ... },
        // }
        const submissionData = parsedData.data.map((d) => d.data)

        resolve(processData(submissionData, context))

        break
      default:
        reject(statusCode, rawData)
    }
  })
  response.on('error', data => {
    reject(data)
  })
}

// *************************
// Express Application Setup
// *************************

app.get('/', (req, res) => res.send(
                                    '<h1>Welcome to the Example App for Proof Form Query API</h1>' +
                                    '<p>To read more on how to use this example app, visit <a href="https://github.com/proofgov/example-form-query-api">Proof\'s github form query api example page.</a>'
                                   ))

// Use Basic Auth for /covid-cases
app.use('/covid-cases', basicAuth( { authorizer: checkAuthorization } ))


app.get('/covid-cases', (req, res) => {
  const { PROOF_API_TOKEN: apiToken } = process.env
  const { regionId } = users[req.auth.user]
  const region = regions[regionId]

  new Promise((resolve, reject) => {
    if(region) {
      console.log(`Reqesting records for region: ${region.label} (${regionId})`)

      const { id: formId } = loadProviderInfo()
      const options = {
        protocol, port, hostname,
        path: `/api/forms/${formId}/submissions?filters[${regionLookupRecord}]=${regionId}`,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Length': 0,
        },
      }

      new Promise ((sresolve, sreject) => {
          const serverRequest = requester.get(
            options,
            (response) => processServerResponse(sresolve, sreject, response, { regionId })
          )
          serverRequest.on('error', (error) => {
            sreject(error)
          })
          serverRequest.end()

      }).then((data) => {
        resolve(JSON.stringify(data, null, 2))
      }).catch((error, extra) => {
        reject(error, extra)
      })
    } else {
      resolve("Unable to find region " + regionId)
    }
  }).then((body) => {
    console.log(" > Returned data to client\n")
    res.type('application/json')
    res.send(body + "\n")
  }).catch((error, extra) => {
    console.log(" > Returned ERROR to client\n")
    res.status(500)
    res.send(`${error}\n${JSON.stringify(extra) || ''}\n`)
  })
})

app.listen(listenPort, () => console.log(`Example app listening at http://localhost:${listenPort}`))
