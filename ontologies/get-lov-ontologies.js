const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const fetch = require('node-fetch');
const util = require('util');
const N3 = require('n3');
const ProgressBar = require('progress');

// set limit of promises
const limitInfo = pLimit(6);
const limit = pLimit(6);
const fsStatsPromise = util.promisify(fs.stat);
const fsWriteFilePromise = util.promisify(fs.writeFile);
const fsReadFilePromise = util.promisify(fs.readFile);

if(process.argv.length < 4){
  console.error('usage: "node get-lov-ontologies.js [LOV list as json] [output directory]"');
  process.exit(1);
}
const listFilename = process.argv[2];
const outputDirectory = process.argv[3];

const ontologyList = JSON.parse(fs.readFileSync(path.resolve(__dirname, listFilename), 'utf8'));
const folder = path.resolve(__dirname, outputDirectory, `ontologies_lov_${(new Date()).toISOString().slice(0, 10)}`);
if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}

const failedInfos = [];
const failedFetches = [];

const bar = new ProgressBar('processing [:bar] :percent :etas fetched ontology infos :current/:total',
    {total: ontologyList.length, stream: process.stdout, width: 20});
let totalVersions = 0;

const ontologyInfoList = ontologyList.map(ontology => {
    // wrap the function we are calling in the limit function we defined above
    return limitInfo(async () => {
        const infoPath = path.resolve(folder, `${ontology.prefix}.json`);
        // console.log(`Fetching ${ontology.prefix}`);
        let body = '';
        try {
            try {
                body = await fsReadFilePromise(infoPath, 'utf8');
            } catch (e) {
                // worth the shot
            }
            if (!body) {
                body = await (await fetch(`https://lov.linkeddata.es/dataset/lov/api/v2/vocabulary/info?vocab=${ontology.prefix}`)).text();
                await fsWriteFilePromise(infoPath, body, 'utf8');
            }
            body = JSON.parse(body);
            if (body.versions) {
                totalVersions += body.versions.length;
            }
        } catch (error) {
            failedInfos.push({
                ontology,
                error
            });
        }
        bar.tick();
    });
});

Promise.all(ontologyInfoList).then(() => {
    console.log(`Fetched all ${ontologyList.length} ontology infos! Only ${failedInfos.length} failed.`);
    return fsWriteFilePromise(path.resolve(folder, 'failedInfos.json'), JSON.stringify(failedInfos), 'utf8');
}).then(async () => {
    const bar2 = new ProgressBar('processing [:bar] :percent :etas fetched ontology versions :current/:total',
        {total: totalVersions, stream: process.stdout, width: 20});

    const ontologyVersionFetchList = ontologyList.map(async ontology => {
        const ontologyInfo = JSON.parse(await fsReadFilePromise(path.resolve(folder, `${ontology.prefix}.json`), 'utf8'));
        if (!ontologyInfo.versions) {
            return [];
        }
        return ontologyInfo.versions.map(ontologyVersion => {
            return limit(async () => {
                // console.log(`Fetching ${ontology.prefix} ${ontologyVersion.name}`);
                const versionPath = path.resolve(folder, `${ontology.prefix}_${ontologyVersion.name.replace(/[\s\\\/]+/g, '-')}_${ontologyVersion.issued.slice(0, 10)}_${ontologyVersion._id}.nt`);
                let body = '';
                try {
                    body = await fsReadFilePromise(versionPath, 'utf8');
                } catch (e) {
                    // worth the shot
                }
                if (body) {
                    bar2.tick();
                    return Promise.resolve();
                }
                try {
                    body = await (await fetch(ontologyVersion.fileURL)).text();
                } catch (error) {
                    failedFetches.push({
                        ontology,
                        ontologyVersion,
                        error
                    });
                    return;
                }
                const writer = new N3.Writer({format: 'N-Triples'});
                const parser = new N3.Parser();
                return new Promise((resolve, reject) => {
                    parser.parse(body, async function (error, quad, prefixes) {
                        if (error) {
                            failedFetches.push({
                                ontology,
                                ontologyVersion,
                                error
                            });
                            resolve();
                            bar2.tick()
                        }
                        if (quad) {
                            writer.addQuad(quad)
                        } else {
                            writer.end(async (err, result) => {
                                resolve(await fsWriteFilePromise(versionPath, result));
                                bar2.tick();
                            });
                        }
                    });
                });
            });
        });
    });

    Promise.all(ontologyVersionFetchList).then(async (versionsSetups) => {
        versionsSetups = [].concat(...versionsSetups);
        Promise.all(versionsSetups).then(() => {
            console.log(`Fetched all ${versionsSetups.length} ontologies! Only ${failedFetches.length} failed.`);
            return fsWriteFilePromise(path.resolve(folder, 'failedFetches.json'), JSON.stringify(failedFetches), 'utf8');
        });
    });

});
