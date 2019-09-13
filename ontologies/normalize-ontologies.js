const { execSync } = require('child_process');
const path = require('path');
const ProgressBar = require('progress');
const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: "node normalize-ontologies.js [ontology directory], [output directory]"')
  process.exit(1)
}


let inputFolder = path.resolve(__dirname, process.argv[2]);
let outputFolder = path.resolve(__dirname, process.argv[3]);

let files = fs.readdirSync(inputFolder);

let stats = {
 'importError': 0,
 'invalidFileError': 0,
 'storageError': 0,
 'noSubmissionError': 0,
 'noAccessError': 0,
 'licenseError': 0,
 'unknownErrors': []
}

let errorNoSubmission = "There is no latest submission loaded for download";
let errorNoAccess = "Access denied for this resource";
let errorLicense = "License restrictions on download for";

const bar = new ProgressBar('converting [:bar] :percent ETA :etas [:prefix] converted ontologies :current/:total', {total: files.length, stream: process.stdout, width: 20});

for(var i=0; i<files.length; i++){

  // the next file is important to set the Progress bar correct
  // needed to debug long running files
  var nextFile = (i+1 >= files.length) ? 'X' : files[i+1].split(/_/)[0];

  var prefix = files[i].split(/_/)[0];

  // We are only interested in OWL and OBO files
  var ext = path.extname(files[i]); 
  if( !(ext == '.owl') && !(ext == '.obo')){
    console.log("No owl or obo file: " + files[i]);
    bar.tick({'prefix': nextFile});
    continue;
  }

  // copy name and replace file extension
  var outputFilename = files[i].replace(ext, '.owl');
  var inputFullname = path.resolve(inputFolder, files[i]);
  var outputFullname = path.resolve(outputFolder, outputFilename);

  // Don't to the same work again
  if(fs.existsSync(outputFullname)){
    bar.tick({'prefix': nextFile});
    continue;
  }


  // The fetching produced some files which are actually HTML error pages
  var fileStats = fs.statSync(inputFullname);
  if(fileStats['size'] < 2000000){
    var content = fs.readFileSync(inputFullname, 'utf8');
    if(content.startsWith('<html>')){
      if(content.indexOf(errorNoSubmission) !== -1){
        stats.noSubmissionError++;
      } else if(content.indexOf(errorNoAccess) !== -1){
        stats.noAccessError++;
      } else if(content.indexOf(errorLicense) !== -1){
        stats.licenseError++;
      } else {
        stats.unknownErrors.push(content);
      }
      bar.tick({'prefix': nextFile});
      continue;
    }
  }
  // Some filenames contain '$', so better use classical string concatenation
  var command = "robot convert --input " + inputFullname + " --output " + outputFullname;

  try {
    execSync(command);
  } 
  catch (error) {
    error.status;  // Might be 127 in your example.
    error.message; // Holds the message you typically want.
    error.stderr;  // Holds the stderr output. Use `.toString()`.
    error.stdout;  // Holds the stdout output. Use `.toString()`.
    if(error.stdout.toString().startsWith('org.semanticweb.owlapi.model.UnloadableImportException: Could not load imported')){
      stats.importError++;
    } else if(error.stdout.toString().startsWith('INVALID ONTOLOGY FILE ERROR')){
      stats.invalidFileError++;
    } else if(error.stdout.toString().startsWith('ONTOLOGY STORAGE ERROR')) {
      stats.storageError++;
    } else {
      console.log(`${error.status} - ${error.message} - ${error.stdout}`);
    }
  }
  bar.tick({'prefix': nextFile});
}
console.log(stats);
