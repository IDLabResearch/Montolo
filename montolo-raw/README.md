This directory contains data and code to create the montolo dataset.

There is a static part (`montolo-static.ttl`) and a dynamic part,
whereas the dynamic part is generated via YARRRML and RML from the given csv files.

The script `create-dataset.sh` currently depends on the following tools:

* [yarrrml-parser](https://github.com/RMLio/yarrrml-parser) to transform the mappings of `montolo-yml` to RML
* [rmlmapper-java](https://github.com/RMLio/rmlmapper-java) to execute the mappings of the provided csv files
* [comunica-sparql-file](https://github.com/comunica/comunica/tree/master/packages/actor-init-sparql-file) to check if the generated RDF is valid


## Example use

```
bash create-dataset.sh
```

