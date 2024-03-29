const express=require('express');
const router=express.Router();
const path = require('path');
const data = require("../data");
const userData = data.users;
// const mcqData = data.mcq;
const { getAll, getLearning, getYetToLearn, getLearnt } = data.words


router.get('/', async(req,res)=>{
    try{
        // res.sendFile(path.resolve('static/addWords.html'));
        let id = req.session.user._id;
        const { wordList, yetToLearnWords, learningWords, learntWords } = await getAll(id);
        let profilePicture= req.session.user.profilePicture;
        let firstName= req.session.user.firstName;
        let lastName= req.session.user.lastName;
        return res.render('words/viewWords', { title:"View Words", wordList: wordList, wordListLength: wordList.length, profilePicture: profilePicture,
                                    firstName: firstName, lastName: lastName,userId:id, yetToLearnWords: yetToLearnWords, learningWords: learningWords,
                                    learntWords: learntWords, yetToLearnWordsLength: yetToLearnWords.length, learningWordsLength: learningWords.length,
                                    learntWordsLength: learntWords.length });
    }catch(e){
       // res.status(500).json({error:e});
        return res.status(500).render('httpErrors/error', {code:'500', description: e});
    }
});

module.exports = router;