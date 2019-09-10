const fss = require('fs');
const fs = require('fs').promises;
const path = require('path');
const ProgressBar = require('progress');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const pLimit = require('p-limit');
const SerializerNTriples = require('@rdfjs/serializer-ntriples');
const rdfjsUtil = require("./rdfjsUtil");
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;
const ParserN3 = require('@rdfjs/parser-n3');

let COUNTER = 0;

const entityMap = {
    '&owl;': 'http://www.w3.org/2002/07/owl#',
    '&obo;': 'http://purl.obolibrary.org/obo/',
    '&rdf;': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    '&rdfs;': 'http://www.w3.org/2000/01/rdf-schema#',
    '&xsd;': 'http://www.w3.org/2001/XMLSchema#',
};

const entityRegex = {};

for (let label in entityMap) {
    entityRegex[label] = new RegExp(label, 'g');
}

main().then(() => {
    console.log('Done!');
});

async function main() {

    if(process.argv.length < 4){
        console.error('usage: "node get-bioportal-ontologies.js [bioportal list as json] [output directory]"');
        process.exit(1);
    }

    const json = await fs.readFile(path.resolve(__dirname, process.argv[2]), 'utf8');
    const folder = path.resolve(__dirname, process.argv[3], `ontologies_bioportal_${(new Date()).toISOString().slice(0, 10)}`);

    try {
        await fs.access(folder);
    } catch (e) {
        await fs.mkdir(folder);
    }
    const ontologyList = JSON.parse(json);

    const failedFetches = [];

    const bar2 = new ProgressBar('processing [:bar] :percent :etas fetched ontology versions :current/:total',
        {total: ontologyList.length, stream: process.stdout, width: 20});

    await asyncForEachLimit(ontologyList, 50, async (rawOntology) => {
        const ontology = {
            prefix: rawOntology.ontology.acronym.replace(/_/g, '-'),
            name: rawOntology.ontology.name,
            url: rawOntology.ontology['@id']
        };
        if (!rawOntology.latest_submission) {
            failedFetches.push({
                ontology,
                ontologyVersion: null,
                error: (new Error('No submission found for ontology ' + ontology.name)).stack
            });
            return;
        }
        const ontologyVersion = {
            name: rawOntology.latest_submission.version || '',
            issued: rawOntology.latest_submission.released,
            _id: rawOntology.latest_submission.submissionId
        };
        try {
            const dlLink = rawOntology.ontology.links.download + "?download_format=rdf";
            // console.log(`Fetching ${ontology.prefix} ${ontologyVersion.name}`);
            const name = `${ontology.prefix}_${ontologyVersion.name.replace(/[:\s\\\/_]+/g, '-').slice(0, 20)}_${ontologyVersion.issued.slice(0, 10)}_${ontologyVersion._id}`;
            const versionOwlPath = path.resolve(folder, `${name}.owl`);
            const versionPath = path.resolve(folder, `${name}.nt`);
            let body = '';
            try {
                body = await fs.readFile(versionPath, 'utf8');
            } catch (e) {
                // worth the shot
            }
            if (body) {
                bar2.tick();
                return;
            }

            try {
                body = await fs.readFile(versionOwlPath, 'utf8');
            } catch (e) {
                try {
                    body = await download(dlLink);
                    await fs.writeFile(versionOwlPath, body, 'utf8');
                } catch (error) {
                    failedFetches.push({
                        ontology,
                        ontologyVersion,
                        error: error.stack
                    });
                    bar2.tick();
                    return;
                }
            }

            try {
                if (body.indexOf('<') === 0) {
                    await owlToNtriplesFile(body, versionPath);
                } else {
                    throw new Error('Not OWL!');
                }
            } catch (error) {
                try {
                    await ttlToNtriplesFile(body, versionPath);
                } catch (error) {
                    await fs.unlink(versionPath);
                    failedFetches.push({
                        ontology,
                        ontologyVersion,
                        error: error.stack
                    });
                }
            }
            bar2.tick();
        } catch (error) {
            failedFetches.push({
                ontology,
                ontologyVersion,
                error: error.stack
            });
        }
    });

    console.log(`Fetched all ${ontologyList.length} ontologies! Only ${failedFetches.length} failed.`);
    await fs.writeFile(path.resolve(folder, 'failedFetches.json'), JSON.stringify(failedFetches), 'utf8');
}

function owlToNtriplesFile(owl, filePath) {
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

function ttlToNtriplesFile(ttl, filePath) {
    return new Promise((resolve, reject) => {
        const ttlStream = rdfjsUtil.stringToStream(ttl);
        ttlStream.on('error', e => {
            return reject(e);
        });
        const myParser = new ParserN3();
        const quadStream = myParser.import(ttlStream);
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
    });
}

async function download(link) {
    console.log(link);
    const command = `curl "${link}" -H "User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: nl,en-US;q=0.7,en;q=0.3" --compressed -H "Referer: http://data.bioontology.org/ontologies" -H "Connection: keep-alive" -H "Cookie: __utma=65578941.769417294.1558535419.1558535419.1558535419.1; __utmz=65578941.1558535419.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not"%"20provided); ncbo_apikey=8b5b7825-538d-40e0-9e9e-5ab9274a9aeb; _ga=GA1.2.769417294.1558535419; _gid=GA1.2.127023474.1558535677" -H "Upgrade-Insecure-Requests: 1"`;
    const {stdout, stderr} = await exec(command, {maxBuffer: 1024 * 1024 * 500}); // maxBuffer 100MB
    return stdout;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function asyncForEachLimit(array, limit, callback) {
    const limitFuntion = pLimit(limit);
    const promises = array.map((item, index) => {
        return limitFuntion(async () => {
            return callback(item, index, array);
        });
    });
    return await Promise.all(promises);
}
