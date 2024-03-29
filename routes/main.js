const express=require('express');
const router=express.Router();
const path = require('path');
const mcqData = require("../data/mcq");
const flashcardData = require("../data/flashcard");

router.get('/', async(req,res)=>{
    try{
        if(req.session.user){
        let firstName=req.session.user.firstName;
        let lastName=req.session.user.lastName;
        let profilePicture=req.session.user.profilePicture;
        let email = req.session.user.email;
        const mcqScore = await mcqData.getPercentage(email);
        const mcqSession = await mcqData.getLastFiveSessionScore(req.session.user._id);
        const scores = mcqSession.scores;
        const mcqSessionId = mcqSession.sessionId;

        const flashcardScore = await flashcardData.getPercentage(email);
        const flashcardSession = await flashcardData.getLastFiveSessionScore(req.session.user._id);
        const fScores = flashcardSession.scores;
        const flashcardSessionId = flashcardSession.sessionId;
        return res.render('dashboard/dashboard', {
            layout: "dashboardMain",firstName: firstName,lastName: lastName, profilePicture: profilePicture, 
            email:email, mcqScore: mcqScore, mcqSession: scores, mcqSessionId: mcqSessionId,
            flashcardScore: flashcardScore, flashcardSession: fScores, flashcardSessionId: flashcardSessionId});
        } 
        else{
           return res.redirect('/login');
        }
        
    }catch(e){
        return res.status(500).json({error:"Hmmm something went wrong"});
    }
});
module.exports = router;