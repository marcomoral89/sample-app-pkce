# Thinkific Sample App

## Tech Stack:

- Node
- Express.js
- EJS
- Bootsrap 5

## Thinkific OAuth Flow:

- PKCE: https://developers.thinkific.com/api/authorization/#authorization-code-flow-with-pkce

## Pre-requisites

- Partner Portal account: https://www.thinkific.com/partners/

## Instructions:

- **Partner Portal**: Create an app to get a **CLIENT_KEY** and **CLIENT_SECRET**
- **Partner Portal**: Add http://localhost:8080/authcodeflow in the **App Settings & Details > Callback URL**
- **Github**: Download sample app files
- **Terminal**: Go to sample app's directory and run **npm install**
- Find and open the **.env** file in the app directory
- Copy-paste your **CLIENT_KEY**. and **CLIENT_SECRET**.
- **Terminal**: run **node app.js**. to start the server

## How to use the sample app:

- Go to the index page
- Install the app to your Thinkific site
- An access token is generated and stored
- User is redirect /app where you can test the Thinkific API endpoints
