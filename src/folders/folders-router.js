const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
  id: folder.id,
  folder_title: xss(folder.folder_title)
})

foldersRouter
    .route('/')
    .get((req, res, next)=>{
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
            .then(folders=>{
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next)=>{
        const {folder_title} = req.body
        const newFolder = {folder_title}

        for(const [key, value] of Object.entries(newFolder)){
            if(value == null){
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body`}
                })
            }
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder =>{
                res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(serializeFolder(folder))
            })
            .catch(next)
    })


foldersRouter
    .route('/:id')
    .all((req, res, next)=>{
        FoldersService.getById(
            req.app.get('db'),
            req.params.id
        )
        .then(folder=>{
            if(!folder){
                return res.status(404).json({
                    error: {message: 'Folder does not exist'}
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next)=>{
        res.json(serializeFolder(res.folder))
    })

module.exports = foldersRouter;