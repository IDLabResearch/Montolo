# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2020-08-20

### Added

- Restriction types, expressions and detectors SHACL core constraints
- LODStats restriction type expression detectors for SHACL core constraints
- Improved curation process: montolo is now generated from content in `montolo-raw` using YARRRML and RML
- Aligned restriction type expressions with Astrea ([paper](https://link.springer.com/chapter/10.1007/978-3-030-49461-2_29), [dataset](https://astrea.helio.linkeddata.es/)), `owl:sameAs`
- Added repository `mon:noRepo` which is used in MontoloSHACLStats
- Added `mon:detectorDimension` which is produced by LOVStats
- Class `:Repository` as not all RDF input data might come from an ontology repository, e.g. SHACL files from GitHub
- `:OntologyRepository` class now a subclass of the new `:Repository` class
- added several `rdfs:comment` triples to provide further information
- added `dc:creator` property to various elements

## Changed

- Replaced `rdfs:seeAlso` with `dc:source`, also these values are no longer resources but now literals of datatype `schema:URL`


## [1.0.0] - 2019-07-19

### Added

- First official version

[1.0.0]: https://github.com/IDLabResearch/montolo/releases/tag/v1.0.0
[1.1.0]: https://github.com/IDLabResearch/montolo/compare/v1.0.0...v1.1.0
