const mongoCollections = require('../config/mongoCollections')
let { ObjectId } = require('mongodb')
const words = mongoCollections.words

// Checks Start
const checkSameSynonym = async (synonym) =>{
    let sameSynonym = false
    for (let i = 1; i < synonym.length; i++) {
        if(synonym[i-1].toLowerCase() == synonym[i].toLowerCase()){
            sameSynonym = true
            throw {code: 401, error: `No 2 synonyms can be same. Every synonynm must be unique`}
        }
    }
}

const checkSameAntonym = async (antonym) => {
    let sameAntonym = false
    for (let i = 1; i < antonym.length; i++) {
        if(antonym[i-1].toLowerCase() == antonym[i].toLowerCase()){
            sameAntonym = true
            throw {code: 401, error: `No 2 antonyms can be same. Every antonym must be unique`}
        }  
    }
}

const checkSameExamples = async (example) => {
    let sameExample = false
    for (let i = 1; i < example.length; i++) {
        if(example[i-1].toLowerCase() == example[i].toLowerCase()){
            sameExample = true
            throw {code: 401, error: `No 2 examples can be same. Every example must be unique`}
        }   
    }
}
// Checks End

const createWordsDocument = async function createWordsDocument(userId) {
    if(arguments.length != 1) {

        throw "Check arguments length"
    }
    if(!userId) {
        throw 'You must provide a userId'
    }
    if(typeof userId != 'string') {
        throw 'userId must be a string'
    }
    let wordCollection = await words()
    userId = ObjectId(userId)
     let newWordObject = {
        _id: new ObjectId(),
        userId: userId,
        words: [],
        yetToLearn: 0,
        learning: 0,
        learnt: 0
    }
    
    const insertWord = await wordCollection.insertOne(newWordObject)  
    if (insertWord.insertedCount === 0) {
        throw {code: 500, error: `Unable to create the word Document`}
    }
    return newWordObject._id
    
}

const addWord = async function (userId,  word, meaning, synonym, antonym, example) {
    if(arguments.length != 6) {
        throw {code: 400, error: `Please provide all arguments`}
    }
    if(!userId || !word || !meaning || !synonym) {
        throw {code: 400, error: `Check if all the arguments are provided`}
    }
    if(typeof userId != 'string' || typeof word != 'string' || typeof meaning != 'string' || typeof synonym != 'string') {
        throw {code: 400, error: `Check if all the arguments are of type string`}
    }
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }
    if(word.trim().length == 0 || meaning.trim().length == 0 || synonym.trim().length == 0) {
        throw {code: 400, error: `Arguments are empty`}
    }
    if(word == meaning || word == synonym || word == antonym || meaning == synonym || meaning == antonym || synonym == antonym) {
        throw {code: 400, error: `Arguments are same`}
    }
    if(!word.match(/^[a-zA-Z]+$/)) {
        throw {code: 400, error: `Word should contain only alphabets`}
    }
    

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to add any words`}
    }
    word = word.toLowerCase()  

    wordDocument.words.forEach(x =>{
        if (x.word.toLowerCase() === word) {
            throw {code: 401, error: "Word already exists in the database."}
        }
    })

    let newWord = {
        word: word,
        meaning: meaning,
        synonyms: [],
        antonyms: [],
        examples: [],
        progress: "yet to learn",
        noOfTimesCorrect: 0
    }

    synonym = synonym.split(", ")
    let testSynonym = synonym.sort().join("")
    await checkSameSynonym(synonym)

    synonym.forEach(x => {
        newWord.synonyms.push(x.trim()) 
    });
    
    if (antonym.length !== 0) {
        antonym = antonym.split(", ")
        let testAntonym = antonym.sort().join("")

        if(testSynonym=== testAntonym){
            throw {code: 401, error: "Synonyms and Antonyms cannot be same"};
        }
        if(!testSynonym.match(/^[a-zA-Z]+$/) || !testAntonym.match(/^[a-zA-Z]+$/)) {
            throw {code: 401, error: "Synonyms and Antonyms should contain only alphabets"};
        }
        await checkSameAntonym(antonym)

        antonym.forEach(x =>{
            newWord.antonyms.push(x.trim())
        })
    }
    if (example.length !== 0) {
        example = example.split(". ")
        for (let i = 0; i < example.length; i++) {
            example[i] = example[i].trim()
            if(example[i].length == 0) {
                throw {code: 401, error: "Example cannot be empty"};
            }
            // if(!example[i].match(/^[a-zA-Z0-9!"',@#\$%\&*\)\(.]+$/g)){
            //     throw {code: 401, error: "Example should contain only alphabets and numbers"};
            // }
        }
        await checkSameExamples(example)

        example.forEach(x =>{
            newWord.examples.push(x.trim())
        })
    }
    
    let result = await wordCollection.updateOne({userId: ObjectId(userId)}, {$addToSet: {words: newWord}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to add the word to the Document`}; 
    }

    let wordDocumentWithWords = await wordCollection.findOne({userId: ObjectId(userId)})
    if (!wordDocumentWithWords) {
        throw {code: 500, error: `Unable to get the word document after adding the word`}
    }

    // updating the YET TO LEARN KEY
    await updateCounters(userId)

}

const editWord = async function editWord(userId, word, synonym, antonym, example) {
    if(arguments.length != 5) {
        throw {code: 400, error: `Check the number of arguments`}
    }
    if(!userId || !word || !synonym) {
       throw {code: 400, error: `Check if all the arguments are provided`}
    }
    if(typeof userId != 'string' || typeof word != 'string' || typeof synonym != 'string') {
       throw {code: 400, error: `Check if all the arguments are of type string`}
    }
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }
    if(word.trim().length == 0 || synonym.trim().length == 0) {
        throw {code: 400, error: `Arguments are empty`}
    }
    if(word == synonym || word == antonym || synonym == antonym) {
        throw {code: 400, error: `Arguments are same`}
    }
    if(!word.match(/^[a-zA-Z]+$/)) {
        throw {code: 400, error: `Word should contain only alphabets`}
    }
   
    

    synonym = synonym.trim(), antonym = antonym.trim(), example = example.trim()
    let countS = 0, countA = 0, countE = 0
    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)});
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to add any words`}
    }
    word = word.toLowerCase() 
    let editingWord, i=0, indexof
    wordDocument.words.every(x => {
        if (x.word.toLowerCase() == word) {
            editingWord = x
            indexof = i
            i++
            return false
        }
        i++
        return true
    })

    synonym = synonym.split(", ")
    let testSynonym = synonym.sort().join("")
    await checkSameSynonym(synonym)
    
    let synonymLenght = synonym.length
    if (synonymLenght > editingWord.synonyms.length) {
        countS = -1
    }else{
        for (let i = 0; i < synonymLenght; i++) {
            let same = false
            for (let j = 0; j < editingWord.synonyms.length; j++) {
                if (editingWord.synonyms[j].toLowerCase() == synonym[i].toLowerCase()) {
                    same = true
                    countS++
                    break
                }            
            }  
        }
    }

    if (antonym.length !== 0) {
        antonym = antonym.split(", ")
        let testAntonym = antonym.sort().join("")
        if(testSynonym=== testAntonym){
            throw {code: 401, error: "Synonyms and Antonyms cannot be same"};
        }
        if(!testSynonym.match(/^[a-zA-Z]+$/) || !testAntonym.match(/^[a-zA-Z]+$/)) {
            throw {code: 401, error: "Synonyms and Antonyms should contain only alphabets"};
        } 
        await checkSameAntonym(antonym)

        let antonymLength = antonym.length
        if (antonymLength > editingWord.antonyms.length) {
            countA = -3
        } else{
            if (editingWord.antonyms.length != 0) {
                for (let i = 0; i < antonymLength; i++) {
                    let same = false
                    for (let j = 0; j < editingWord.antonyms.length; j++) {
                        if (editingWord.antonyms[j].toLowerCase() == antonym[i].toLowerCase()) {
                            same = true
                            countA++
                            break
                        }            
                    }  
                }   
            }else{
                countA = -2
            }
        }
    } else {
        if (antonym.length == editingWord.antonyms.length) {
            countA = 0
        } else{
            countA = -1
        }
    }   
    
    
    
    if (example.length !== 0) {
        example = example.split(". ")
       
        await checkSameExamples(example)

        let exampleLenght = example.length
        if (exampleLenght > editingWord.examples.length) {
            countE = -3
        }else{   
            if (editingWord.examples.length != 0) {
                for (let i = 0; i < exampleLenght; i++) {
                    if(example[i].trim().length == 0) {
                        throw {code: 400, error: `Example is empty`}
                    }
                    let same = false
                    for (let j = 0; j < editingWord.examples.length; j++) {
                        if (editingWord.examples[j].toLowerCase() == example[i].toLowerCase()) {
                            same = true
                            countE++
                            break
                        }            
                    }  
                }   
            } else{
                countE = -2
            }   
        }
    } else {
        if (example.length == editingWord.examples.length) {
            countE = 0
        }else{
            countE = -1
        }
    }    

    if (countS == editingWord.synonyms.length && countA == editingWord.antonyms.length && countE == editingWord.examples.length) {
        throw  `Please provide at least 1 of the elements different in order to edit`
    }

    if (countS != editingWord.synonyms.length) {
        synonym.forEach(x =>{
            x = x.trim()
        })
        editingWord.synonyms = synonym
    }

    if (countA != editingWord.antonyms.length) {
        if (countA == -1) {
            editingWord.antonyms = []
        }else{
            antonym.forEach(x =>{
                x = x.trim()
            })
            editingWord.antonyms = antonym    
        }
    }

    if (countE != editingWord.examples.length) {
        if (countE == -1) {
            editingWord.examples = []
        }else{
            example.forEach(x =>{
                x = x.trim()
            })
            editingWord.examples = example    
        }
    }


    wordDocument.words.every(x => {
        if (x.word.toLowerCase() == word) {
            x = editingWord
            return false
        }
        return true
    })

    let result = await wordCollection.updateOne({userId: ObjectId(userId)}, {$set: {words: wordDocument.words}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to add the word to the Document`} 
    }
}

const getAll = async function getAll(userId) {
    if(arguments.length != 1) {
        throw {code: 400, error: `Check the number of arguments`}
    }
    
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to display words`}
    }

    let wordList = wordDocument.words
    let yetToLearnWords = [], learningWords = [], learntWords = []
    wordDocument.words.forEach(x =>{
        if (x.progress == "yet to learn") {
           yetToLearnWords.push(x) 
        } else if (x.progress == "learning"){
            learningWords.push(x)
        } else {
            learntWords.push(x)
        }
    })

    return { wordList, yetToLearnWords, learningWords, learntWords }
}


const noOfWords = async function noOfWords(userId) {
    if(arguments.length != 1) {
        throw {code: 400, error: `Check the number of arguments`}
    }
   
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})
    if (!wordDocument) {
        throw {code: 404, error: `No such userId exists to display`}
    }

    return wordDocument.words.length   
}

const updateAllWordsProgress = async function updateAllWordsProgress(userId, correctArray, incorrectArray) {
    if(arguments.length != 3) {
        throw {code: 400, error: `Check the number of arguments`}
    }
  
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }
    if(!Array.isArray(correctArray)) {
        throw {code: 400, error: `Check if the argument is of type array`}
    }
    if(!Array.isArray(incorrectArray)) {
        throw {code: 400, error: `Check if the argument is of type array`}
    }

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})

    correctArray.forEach(x => {
        wordDocument.words.every(async y => {
            if (x.toLowerCase() == y.word.toLowerCase()) {
                y.noOfTimesCorrect++
                if (y.noOfTimesCorrect == 3) {
                    y.progress = "learnt"
                }
                let updatingNoOfTimesCorrect = await wordCollection.updateOne({userId: ObjectId(userId)}, {$set: {words: wordDocument.words}})
            }
        })
    })

    incorrectArray.forEach(x => {
        wordDocument.words.every(async y => {
            if (x.toLowerCase() == y.word.toLowerCase()) {
                if (y.progress == "learnt") {
                    y.progress = "learning"
                    y.noOfTimesCorrect = 1
                    let updatingNoOfTimesCorrect = await wordCollection.updateOne({userId: ObjectId(userId)}, {$set: {words: wordDocument.words}})
                }
            }
        })
    })
}

const updateProgressToLearning = async function updateProgressToLearning(userId, word) {
    if(arguments.length != 2) {
        throw {code: 400, error: `Check the number of arguments`}
    }
    
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }
    if(typeof word != 'string') {
        throw {code: 400, error: `Check if the argument is of type string`}
    }

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})
    
    await wordDocument.words.every(async x =>{
        if (x.word == word) {
            x.progress = "learning"
            let updatingProgress = await wordCollection.updateOne({userId: ObjectId(userId)}, {$set: {words: wordDocument.words}})
            if (!updatingProgress) {
                throw {code: 500, error: `Cannot update the progress status of the word to learning`}
            }
        }
    })

}

const updateCounters = async function updateCounters(userId) {
    if(arguments.length != 1) {
        throw {code: 400, error: `Check the number of arguments`}
    }
    if(!ObjectId.isValid(userId)) {
        throw {code: 400, error: `UserId is invalid`}
    }

    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})

    let yetToLearnWords = [], learningWords = [], learntWords = []
    wordDocument.words.forEach(x =>{
        if (x.progress == "yet to learn") {
           yetToLearnWords.push(x) 
        } else if (x.progress == "learning"){
            learningWords.push(x)
        } else {
            learntWords.push(x)
        }
    })
    
    result = await wordCollection.updateOne({userId: ObjectId(userId)}, {$set: {yetToLearn: yetToLearnWords.length, learning:learningWords.length, learnt: learntWords.length }})
}

const addWordSeed = async function addWordSeed(userId, word, meaning, synonyms, antonyms, examples, progress, noOfTimesCorrect){
    let wordCollection = await words()
    let wordDocument = await wordCollection.findOne({userId: ObjectId(userId)})

    word = word.toLowerCase()  
    wordDocument.words.forEach(x =>{
        if (x.word.toLowerCase() === word) {
            throw {code: 401, error: "Word already exists in the database."}
        }
    })

    let newWord = {
        word: word,
        meaning: meaning,
        synonyms: synonyms,
        antonyms: antonyms,
        examples: examples,
        progress: progress,
        noOfTimesCorrect: noOfTimesCorrect
    }
    
    let result = await wordCollection.updateOne({userId: ObjectId(userId)}, {$addToSet: {words: newWord}})
    if (result.modifiedCount === 0) {
        throw {code: 500, error: `Unable to add the word to the Document`}; 
    }

}

module.exports = {
    createWordsDocument,
    addWord, 
    editWord,
    getAll,
    noOfWords,
    updateAllWordsProgress,
    updateProgressToLearning,
    updateCounters,
    addWordSeed,
}