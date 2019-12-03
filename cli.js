#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const compiler = require('@alex.garcia/unofficial-observablehq-compiler')
const serveIndex = require('serve-index')

require('yargs') // eslint-disable-line
  .command(
    'serve <port> [path]',
    'Serve observable notebooks in folder',
    (yargs) => {
      yargs.positional('port', {
        describe: 'Port of the http server'
      })
      yargs.positional('path', {
        describe: 'Path to model folder'
      })
    },
    (argv) => {
      const express = require('express')
      const app = express()
      const port = argv.port
      const base = path.resolve(argv.path || process.cwd())
      const notebookTemplate = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8')

      app.use('/', serveIndex(base, {
        'icons': true,
        filter: (filename, index, files, dir) =>  {
          const isNotebook = filename.match(/notebook\.js$/)
          const isFolder = fs.lstatSync(path.join(dir, filename)).isDirectory()

          return isNotebook || isFolder
        }
      }))

      app.use('*.notebook.js', (req, res) => {
        const notebookPath = path.join(base, req.baseUrl)
        const notebook = fs.readFileSync(notebookPath, 'utf-8')
        const html = notebookTemplate.replace(/TEMPLATETAG/g, notebook)

        res.send(html)
      })

      app.listen(port, () => {
        console.log(`Observable server listening on port ${port}!`)
        console.log(`Root folder at: ${base}`)
      })
    }
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .argv
