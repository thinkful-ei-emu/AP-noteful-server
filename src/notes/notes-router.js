const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
  id: note.id,
  note_title: xss(note.note_title),
  content: xss(note.content),
  folder_id: note.folder_id,
  modified: new Date(note.modified).toLocaleDateString()
})

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    NotesService.getallNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { note_title, content, folder_id, modified } = req.body
    const newNote = { note_title, content, folder_id }

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    newNote.modified = modified
    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNote(note))
      })
      .catch(next)
  })

notesRouter
  .route('/:id')

  .all((req, res, next) => {
    NotesService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: 'Note does not exist' }
          })
        }
        res.note = note
        next()
      })
      .catch(next)
  })

  .get((req, res, next) => {
    res.json(serializeNote(res.note))
  })

  .delete((req, res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.id
    )
      .then(response => {
        res.status(204).end()
      })
      .catch(next)
  })
  

module.exports = notesRouter
