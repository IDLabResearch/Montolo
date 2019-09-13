const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const rdfjsUtil = require("./rdfjsUtil");
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;
const SerializerNTriples = require('@rdfjs/serializer-ntriples');
const ParserN3 = require('@rdfjs/parser-n3');


async function main(){

  if (process.argv.length < 4) {
    console.error('Usage: "node convertRDFToNtriples.js [ontology directory], [output directory]"')
    process.exit(1)
  }

  let inputFolder = path.resolve(__dirname, process.argv[2]);
  let outputFolder = path.resolve(__dirname, process.argv[3]);

  let files = fss.readdirSync(inputFolder);

  let stats = {
  'readError': 0,
  'parseError': 0,
  'failedReading': [],
  'failedParsing': []
  };

  console.log("Start processing " + files.length + " files!");
  for(var i=0; i<files.length; i++){

    if(path.extname(files[i]) != '.owl'){
      continue;
    }

    var prefix = files[i].split(/_/)[0];
    var content = '';
    try {

      var inputFile = path.resolve(inputFolder, files[i]);
      var outputFile = path.resolve(outputFolder, files[i].replace('.owl', '.nt'));
      content = await fs.readFile(inputFile, 'utf8');

    } catch (error){
      stats.readError++;
      stats.failedReading.push(prefix);
      continue;
    }

    try {
      rdfToNtriplesFile(content, outputFile);
    } catch (error){
      stats.parseError++;
      stats.failedParsing.push(prefix);
    }

  }
  console.log(stats);

}

function rdfToNtriplesFile(owl, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const owlStream = rdfjsUtil.stringToStream(owl);
            owlStream.on('error', e => {
                return reject(e);
            });
            const myParser = new RdfXmlParser();
            const quadStream = myParser.import(owlStream);
            quadStream.on('error', e => {
                return reject(e);
            });
            const serializerNtriples = new SerializerNTriples();
            const ntriplesStringStream = serializerNtriples.import(quadStream);
            ntriplesStringStream.on('error', e => {
                return reject(e);
            });
            const writeFileStream = fss.createWriteStream(filePath);
            ntriplesStringStream.pipe(writeFileStream);
            writeFileStream.on('error', e => {
                return reject(e);
            });
            writeFileStream.on('end', () => {
                return resolve();
            });
        } catch (e) {
            return reject(e);
        }
    });
}

main();
