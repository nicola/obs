#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const compiler = require('@alex.garcia/unofficial-observablehq-compiler')
const { parseModule } = require('@observablehq/parser')
const serveIndex = require('serve-index')
// const { Inspector, Runtime } = require("@observablehq/runtime");

require('yargs')
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

      app.use('/dist', express.static(path.join(__dirname, 'dist')))

      app.use('/', serveIndex(base, {
        'icons': true,
        filter: (filename, index, files, dir) =>  {
          const isNotebook = filename.match(/notebook\.js$/)
          const isFolder = fs.lstatSync(path.join(dir, filename)).isDirectory()

          return isNotebook || isFolder
        }
      }))

      app.use('*.notebook.js', (req, res) => {
        const notebookTemplate = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8')
        const notebookPath = path.join(base, req.baseUrl)
        const notebook = fs.readFileSync(notebookPath, 'utf-8')
        const escapedNotebook = notebook.replace(/`/g, '\\`').replace(/\$/g, '\\$')
        const html = notebookTemplate // .replace(/TEMPLATETAG/g, notebook)

        res.send(html)
      })

      app.use('*.notebook.raw.js', (req, res) => {
        const notebookPath = path.join(base, req.baseUrl.replace('.raw', ''))
        const notebook = fs.readFileSync(notebookPath, 'utf-8')
        res.type('text')
        res.send(notebook)
      })

      app.use('*.notebook.define.js', (req, res) => {
        const notebookPath = path.join(base, req.baseUrl.replace('.define', ''))
        const notebook = fs.readFileSync(notebookPath, 'utf-8')

        res.send(parseModule(notebook))
      })

      app.use('/', express.static(base))

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
