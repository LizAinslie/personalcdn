/* personalcdn - tiny cdn in >100 lines.
*  built by https://ronthecookie.me
*  optimized for https://getsharex.com
*/
const express = require("express");
const app = express();
const fs = require("fs");
const randomstring = require("randomstring");
const mime = require("mime-types");
const auth = require('./config.json').auth;
const sha512 = require("sha512");
const fileUpload = require("express-fileupload");
const baseUri = 'https://i.railrunner16.me/';
const path = require('path');
const rethinkdb = require('rethinkdbdash')({ discovery: true, host: 'localhost', port: 28016, db: 'imgs' });
const ejs = require('ejs')

try {
	fs.mkdirSync("data")
}catch(error){}
app.get("/", (req, res)=>{
	rethinkdb.table('images').run().then(result => {
		ejs.renderFile('index.ejs', {files: result}, (err, str) => {
			if (err) console.error(err)
			res.send(str)
		})
	})
});
app.use(express.static("data"));
app.use(fileUpload({preserveExtension: true, safeFileNames: true}))
app.post("/upload", (req, res) => {
	rethinkdb.table('logins').run().then(logins => {
		console.info(logins)
		const login = {
			username: req.body.user,
			password: req.body.pass
		}
		let issue = null; 
		if (logins.includes(login)) {
			if (!req.files) return res.send("no files");
			let v = req.files.file;
			if (!v) return res.send("no files file")
			let rdm = randomstring.generate(7)
			let ext = mime.extension(v.mimetype);
			if (!ext) return issue = "invalid mimetype.";
		        let fn = rdm+"."+ext;
			rethinkdb.table('images').insert({
				id: fn,
				url: baseUri + fn
			}).run(err => {
				if (err) console.error(err)
				console.info(`Uploaded ${fn}`)
			});
			v.mv("data/"+fn)
			if (issue) return res.json({ error: issue });
			ejs.renderFile('upload.ejs', { file: baseUri + fn }, (err, str) => {
				if (err) console.error(err)
				res.send(str)
			})
		} else {
			res.sendStatus(403);
		}
	})
});
app.use(fileUpload({safeFileNames:true, preserveExtension:true}));
app.listen(process.env.PORT || 3001);
console.log("running on port 3001")
