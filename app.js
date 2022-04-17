require('dotenv').config();
require('./config/database').connect();

const bcrypt = require('bcryptjs');
const express = require('express');
const User = require('./model/user');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

const app = express();

app.use(express.json());

// Create login
app.post('/register' , async (req , res) => {
    try{
        const {first_name , last_name , email , password} = req.body;
        if( !(first_name && last_name && email && password) ){
            res.status(400).send('All input is required');
        }
        const oldUser = await User.findOne({email});
        if(oldUser){
            return res.status(409).send('User already exist.Please login');
        }
        encryptedPassword = await bcrypt.hash(password , 10);
        const user = await User.create({
            first_name: first_name,
            last_name: last_name,
            email: email.toLowerCase(),
            password: encryptedPassword
        });

        // Create token
        const token = jwt.sign(
            {user_id: user._id , email},
            process.env.TOKEN_KEY,
            {
                expiresIn: '2h'
            }
        );

        // Save user token
        user.token = token;
        
        // Return new user
        res.status(201).json(user);

    }catch(err){
        console.log(err);
    } 
});

app.post('/login' , async (req , res) => {
    try{
        const {email , password} = req.body;
        if(!(email && password)){
            res.status(400).send('All input is required');
        }

        const user = await User.findOne({email});
        if(user && (await bcrypt.compare(password , user.password))){
            // Create token
            const token = jwt.sign(
                {user_id: user._id , email},
                process.env.TOKEN_KEY,
                {
                    expiresIn: '2h'
                }
            );
            // Save token
            user.token = token;
            return res.status(200).json(user);
        }

        res.status(400).send("Invalid Credentials");

    }catch(err){
        console.log(err);
    }
});

app.post('/welcome' , auth , (req , res) => {
    res.status(200).send('Welcome');
});

module.exports = app;