giraffe
=======

A Universal Web Based RSS Reader

User System Requirements
-------------------------
An internet connection and a web browser with Javascript enabled. 

Developer System Requirements
------------------------------
To setup a local server to work on Giraffe:

1. SETUP NODE.JS
	Download Node.js and install it
2. SETUP MONGO DB
	Download MongoDB and install it
3. START MONOG DB
	Go to the directory where you installed Mongo DB (root directory), and run the following command
	"%~dp0mongo\mongod.exe" --dbpath "%~dp0mongo\data"
4. START NODE.JS
	In directory ../server, run command "npm install" && node server.js
5. Go to webbrowser and navigate to localhost:3000

Appendix
--------
[Node js Download Site](http://nodejs.org/)
[Mongodb Download Site](http://www.mongodb.org/)