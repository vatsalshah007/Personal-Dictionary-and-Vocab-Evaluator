const mongoCollections = require('../config/mongoCollections')
let { ObjectId } = require('mongodb')
const words = mongoCollections.words


const createWordsDocument = async function createWordsDocument(userId) {
    let wordCollection = await words()
    // let result
    let newWordObject = {
        _id: new ObjectId(),
        userId: userId,
        words: [],
        yetToLearn: 0,
        learning: 0,
        learnt: 0
    }
    
    // newWordObject.words.push(newWord)
    const insertWord = await wordCollection.insertOne(newWordObject)  
    if (insertWord.insertedCount === 0) {
        throw {code: 500, error: `Unable to add the word`}
    }


    return newWordObject._id
    
}

const addWord = async function (userId,  word, meaning, synonym, antonym, example) {
    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: userId})
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to add any words`}
    }
    word = word.toLowerCase()  
    let newWord = {
        word: word,
        meaning: meaning,
        synonyms: [],
        antonyms: [],
        examples: [],
        progress: "yet to learn",
        noOfTimesCorrect: 0
    }

    synonym = synonym.split(" ")
    synonym.forEach(x => {
        newWord.synonyms.push(x) 
    });
    antonym = antonym.split(" ")
    antonym.forEach(x =>{
        newWord.antonyms.push(x)
    })
    example = example.split(".")
    example.forEach(x =>{
        newWord.examples.push(x)
    })

    let result = await wordCollection.updateOne({userId: userId}, {$addToSet: {words: newWord}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to add the word to the Document`} 
    }

    let wordDocumentWithWords = await wordCollection.findOne({userId: userId})
    if (!wordDocumentWithWords) {
        throw {code: 500, error: `Unable to get the word document after adding the word`}
    }
    // updating the YET TO LEARN KEY
    result = await wordCollection.updateOne({userId: userId}, {$set: {yetToLearn: wordDocumentWithWords.words.length}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to update the overallRating of the restaurant`} 
    }

}

const editWord = async function editWord(userId, word, synonym, antonym, example) {
    if (!synonym && !antonym && !example) {
        throw `Please specify at least 1 of the items to be edited.`
    }
    if (synonym.trim().length == 0) {
        throw `Items to be edited cannot be just empty spaces.`
    }

    synonym = synonym.trim(), antonym = antonym.trim(), example = example.trim()
    let countS = 0, countA = 0, countE = 0
    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: userId})
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to add any words`}
    }
    word = word.toLowerCase() 
    let editingWord 
    wordDocument.words.forEach(x => {
        if (x.word == word) {
            editingWord = x
        }
    })

    synonym = synonym.split(", ")
    let synonymLenght = synonym.length
    for (let i = 0; i < synonymLenght; i++) {
        let same = false
        for (let j = 0; j < editingWord.synonyms.length; j++) {
            if (editingWord.synonyms[j] == synonym[i]) {
                same = true
                countS++
                break
            }            
        }  
        // if (!same) {
        //     editingWord.synonyms.push(synonym[i])        
        // }  
    }

    if (antonym.trim().length !== 0) {
        antonym = antonym.split(", ")
        let antonymLenght = antonym.length
        for (let i = 0; i < antonymLenght; i++) {
            let same = false
            for (let j = 0; j < editingWord.antonyms.length; j++) {
                if (editingWord.antonyms[j] == antonym[i]) {
                    same = true
                    countA++
                    break
                }            
            }  
            // if (!same) {
            //     editingWord.antonyms.push(antonym[i])        
            // }  
        }
    }    
    
    if (example.trim().length !== 0) {
        example = example.split(". ")
        let exampleLenght = example.length
        for (let i = 0; i < exampleLenght; i++) {
            let same = false
            for (let j = 0; j < editingWord.examples.length; j++) {
                if (editingWord.examples[j] == example[i]) {
                    same = true
                    countE++
                    break
                }            
            }  
            // if (!same) {
            //     editingWord.examples.push(example[i])        
            // }  
        }
    }

    if (countS == synonym.length && countA == antonym.length && countE == example.length) {
        throw  `Please provide at least 1 of the elements different in order to edit`
    }

    if (countS != synonym.length) {
        editingWord.synonyms = synonym
    }

    if (countA != antonym.length) {
        editingWord.antonyms = antonym
    }

    if (countE != example.length) {
        editingWord.examples = example
    }

    let result = await wordCollection.updateOne({userId: userId}, {$set: {words: wordDocument.words}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to add the word to the Document`} 
    }
}


module.exports = {
    createWordsDocument,
    addWord, 
    editWord
}