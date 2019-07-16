const fs = require('fs-extra');
const path = require('path');

main()

async function main() {

    if(process.argv.length < 4){
        console.error('usage: "node get-latest-ontologies.js [ontology directory] [output directory]"');
        process.exit(1);
    }

    const ontologyDir = path.resolve(__dirname, process.argv[2]);
    const ontologyLatestDir = path.resolve(__dirname, process.argv[3]);

    if(!fs.existsSync(ontologyLatestDir)){
        await fs.mkdir(ontologyLatestDir);
    }
    const files = await fs.readdir(ontologyDir);
    const latest = {};
    files.forEach(file => {

        // The json file with meta information is needed for further processing
        // and thus should be copied too
        if (file.endsWith('.json')) {
            fs.copy(path.resolve(ontologyDir, file), path.resolve(ontologyLatestDir, file));
        }
        else if (!file.endsWith('.nt')) {
            return;
        }
        const parts = file.split('_');
        if (!latest[parts[0]]) {
            latest[parts[0]] = {
                path: file,
                date: new Date(parts[2])
            }
        } else {
            const newDate = new Date(parts[2]);
            if (latest[parts[0]].date < newDate) {
                latest[parts[0]] = {
                    path: file,
                    date: newDate
                }
            }
        }
    });
    const copies = [];

    // copy latest ontology file to new directory
    Object.keys(latest).forEach(key => {
        copies.push(fs.copy(path.resolve(ontologyDir, latest[key].path), path.resolve(ontologyLatestDir, latest[key].path)));
    });
    await Promise.all(copies);
    console.log('done!');
}
