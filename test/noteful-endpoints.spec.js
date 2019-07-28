const knex = require("knex");
const app = require("../src/app");
const { makeFoldersArray } = require("./folders.fixtures");
const { makeNotesArray } = require("./notes.fixtures");

describe.only("Noteful Endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });

    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean tables", () =>
    db.raw("TRUNCATE folders, notes RESTART IDENTITY CASCADE")
  );

  afterEach("clean-up", () =>
    db.raw("TRUNCATE folders, notes RESTART IDENTITY CASCADE")
  );

  describe("GET /folders and /notes", () => {
    context("Given no folders", () => {
      it("responds with 200 and empty array", () => {
        return supertest(app)
          .get("/folders")
          .expect(200, []);
      });
    });

    context("Given no notes", () => {
      it("responds with 200 and empty array", () => {
        return supertest(app)
          .get("/notes")
          .expect(200, []);
      });
    });

    context("Given folders and notes in db", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert test data", () => {
        return db
          .into("folders")
          .insert(testFolders)
          .then(() => {
            return db.into("notes").insert(testNotes);
          });
      });

      it("responds with 200 and all folders and notes", () => {
        return supertest(app)
          .get("/folders")
          .expect(200, testFolders)
          .then(() => {
            return supertest(app)
              .get("/notes")
              .expect(200, testNotes);
          });
      });
    });
  });

  describe("GET /folders/:id and /notes/:id", () => {
    context("Given no folders", () => {
      it("responds with 404", () => {
        const folder_id = 123123;
        return supertest(app)
          .get(`/folders/${folder_id}`)
          .expect(404, {
            error: { message: "Folder does not exist" }
          });
      });
    });

    context("Given no notes", () => {
      it("responds with 404", () => {
        const note_id = 123123;
        return supertest(app)
          .get(`/notes/${note_id}`)
          .expect(404, {
            error: { message: "Note does not exist" }
          });
      });
    });

    context("Given there are folders and notes", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert test data", () => {
        return db
          .into("folders")
          .insert(testFolders)
          .then(() => {
            return db.into("notes").insert(testNotes);
          });
      });

      it("responds with 200 and specific folder by id", () => {
        const folder_id = 50;
        const expectedFolder = testFolders[0];

        return supertest(app)
          .get(`/folders/${folder_id}`)
          .expect(expectedFolder);
      });

      it("responds with 200 and specific note by id", () => {
        const note_id = 3;
        const expectedNote = testNotes[note_id - 1];

        return supertest(app)
          .get(`/notes/${note_id}`)
          .expect(expectedNote);
      });
    });
  });

  describe("POST /folders", () => {
    const testFolders = makeFoldersArray();

    beforeEach("insert folders", () => {
      return db.into("folders").insert(testFolders);
    });

    it("creates new folder with 201", () => {
      const newFolder = {
        folder_title: "Test folder post"
      };
      return supertest(app)
        .post("/folders")
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.folder_title).to.eql(newFolder.folder_title);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/folders/${res.body.id}`);
        })
        .then(res => {
          supertest(app)
            .get(`/folders/${res.body.id}`)
            .expect(res.body);
        });
    });
    
  });

  describe('Post /notes', ()=>{
      const testNotes = makeNotesArray()
      const testFolders = makeFoldersArray()

      beforeEach('insert test data', ()=>{
          return db
          .into('folders')
          .insert(testFolders)
          .then(()=>{
              return db
              .into('notes')
              .insert(testNotes)
          })
      })

      //works but have to change ids of test notes before hand, so it will fail if testNotes ids kept 1, 2, 3, works with 2,3,4
      it('creates new note with 201', ()=>{
          const newNote = {
              note_title: 'Test note post',
              content: "Test note post",
              folder_id: 50,
          }
          return supertest(app)
              .post('/notes')
              .send(newNote)
              .expect(201)
              .expect(res=>{
                  expect(res.body.note_title).to.eql(newNote.note_title)
                  expect(res.body.content).to.eql(newNote.content)
                  expect(res.body).to.have.property('id')
                  expect(res.headers.location).to.eql(`/notes/${res.body.id}`)
              })
              .then(res=>{
                  supertest(app)
                  .get(`/notes/${res.body.id}`)
                  .expect(res.body)
              })
      })

      const requiredFields = ['note_title', 'content', 'folder_id']
      requiredFields.forEach(field=>{
          const newNote = {
              note_title: 'Test note title',
              content: 'Test note content',
              folder_id: 50
          }
          it('responds with 400 and error message if field is missing', ()=>{
              delete newNote[field]
              
              return supertest(app)
              .post(`/notes`)
              .send(newNote)
              .expect(400, {error: {message: `Missing '${field}' in request body`}})
          })
      })

  })

  describe("DELETE /notes/:id", () => {
    context("Given no notes", () => {
      it("responds with 404", () => {
        const noteId = 123123;
        return supertest(app)
          .delete(`/notes/${noteId}`)
          .expect(404, { error: { message: "Note does not exist" } });
      });
    });

    context("Given notes in db", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert test data", () => {
        return db
          .into("folders")
          .insert(testFolders)
          .then(() => {
            return db.into("notes").insert(testNotes);
          });
      });
      it("responds with 204 and removes note", () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
        return supertest(app)
        .delete(`/notes/${idToRemove}`)
        .expect(204)
        .then(res=>{
            supertest(app)
            .get(`/notes`)
            .expect(expectedNotes)
        })
      });
    });
  });
});
