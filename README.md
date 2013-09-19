giraffe
=======

A Universal Web Based RSS Reader

User System Requirements
-------------------------
An internet connection and a web browser with Javascript enabled. 

Developer System Requirements
------------------------------
To set up Giraffe on a local server:

1. **SETUP NODE.JS**

	Download Node.js and install it

2. **SETUP MONGO DB**

	Download MongoDB and install it

3. **START MONGO DB**

	Linux/OSX:

        mongod

	Windows: Go to the directory where you installed Mongo DB (root directory), and run

        %~dp0mongo\mongod.exe" --dbpath "%~dp0mongo\data"

4. **START NODE.JS**

	In directory /server
	
        npm install
        node server.js

5. Go to web browser and navigate to localhost:3000

Appendix
--------
[Node.js Download Site](http://nodejs.org/)

[MongoDB Download Site](http://www.mongodb.org/)
