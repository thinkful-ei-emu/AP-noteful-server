function makeNotesArray(){
    return [
        {
           id: 1,
           note_title: "Test note 1",
           content: "Test content 1",
           folder_id: 50,
           modified: new Date('2029-01-22T16:28:32.615Z').toLocaleDateString()

        },

        {
            id: 2,
            note_title: "Test note 2",
            content: "Test content 2",
            folder_id: 51,
            modified: new Date('2100-05-22T16:28:32.615Z').toLocaleDateString()
 
         },

         {
            id: 3,
            note_title: "Test note 3",
            content: "Test content 3",
            folder_id: 52,
            modified: new Date('2100-05-22T16:28:33.615Z').toLocaleDateString()
         }

    ]
}

module.exports = {makeNotesArray}