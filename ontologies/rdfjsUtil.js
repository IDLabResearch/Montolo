const fs = require('fs');
const path = require('path');
const RDFXMLProcessor = require('rdfxmlprocessor');
const {DataFactory} = require('n3');
const {DOMParser} = require('xmldom'); //Or just DOMParser in the browser
const SerializerNTriples = require('@rdfjs/serializer-ntriples');
const Stream = require('stream');
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;

// owlToNtriplesFile(fs.readFileSync('C:\\Ben\\Work\\iMinds\\Projects\\lovcube\\lovcube-integrator\\lovver\\resources\\ontologies_bioportal_2019-05-24\\MOOCCUADO__2015-08-06_2.owl', 'utf8'), 'tst.nt').then(() =>{
//     console.log('Done');
// }).catch(e => {
//     throw e;
// });

function owlToNtriplesFile(owl, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const owlStream = stringToStream(owl);
            owlStream.on('error', e => {
                return reject(e);
            });
            const myParser = new RdfXmlParser();
            const quadStream = myParser.import(owlStream);
            myParser.on("error", e=>{
                return reject(e);
            });
            quadStream.on('error', e => {
                return reject(e);
            });
            const serializerNtriples = new SerializerNTriples();
            const ntriplesStringStream = serializerNtriples.import(quadStream);
            ntriplesStringStream.on('error', e => {
                return reject(e);
            });
            const writeFileStream = fs.createWriteStream(filePath);
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

async function parseOwlString(owl) {
    const myParser = new RdfXmlParser();
    const owlStream = stringToStream(owl);
    const outStream = myParser.import(owlStream);
    return quadStreamToList(outStream);
}

async function quadStreamToList(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        stream.on("data", function (chunk) {
            chunks.push(chunk);
        });

        // Send the buffer or you can put it into a var
        stream.on("end", function () {
            resolve(chunks);
        });
    });
}

async function parseOwlStringPC(owl, baseUrl = 'http://example.com') {
    const parser = new RDFXMLProcessor(DataFactory);
    return new Promise((resolve, reject) => {
        const triples = [];
        try {
            parser.parse(new DOMParser().parseFromString(owl), baseUrl, null, function (triple) {
                if (triple)
                    triples.push(triple);
                else {
                    return resolve(triples);
                }
            });
        } catch (e) {
            return reject(e);
        }
    });
}

function stringToStream(str) {
    const Readable = require('stream').Readable;
    const s = new Readable();
    s._read = () => {
    }; // redundant? see update below
    s.push(str);
    s.push(null);
    return s;
}

async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        try {
            const chunks = [];

            stream.on("data", function (chunk) {
                chunks.push(chunk);
            });

            // Send the buffer or you can put it into a var
            stream.on("end", function () {
                resolve(Buffer.concat(chunks).toString('utf8'));
            });
        } catch (e) {
            return reject(e);
        }
    });
}

async function triplesToNTriples(triples) {
    return new Promise((resolve, reject) => {
        const readable = new Stream.Readable({objectMode: true});

        const serializerNtriples = new SerializerNTriples();
        const outStream = serializerNtriples.import(readable);
        triples.forEach(triple => readable.push(triple));
        readable.push(null);

        const chunks = [];

        outStream.on("data", function (chunk) {
            chunks.push(chunk);
        });

        // Send the buffer or you can put it into a var
        outStream.on("end", function () {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
    });
}

async function owlToTtl(owl, baseUrl = 'http://example.com') {

    const parser = new RDFXMLProcessor(DataFactory);
    return new Promise((resolve, reject) => {
        const triples = [];
        try {
            parser.parse(new DOMParser().parseFromString(owl), baseUrl, null, function (triple) {
                if (triple)
                    triples.push(triple);
                else {
                    return resolve(triples.join(' .\n') + ' .\n');
                }
            });
        } catch (e) {
            return reject(e);
        }
    });

}

function parseOwlStreamToNTriplesStream(owlStream) {
    const myParser = new RdfXmlParser();
    const quadStream = myParser.import(owlStream);
    const serializerNtriples = new SerializerNTriples();
    return serializerNtriples.import(quadStream);
}

module.exports = {
    owlToTtl,
    stringToStream
};
