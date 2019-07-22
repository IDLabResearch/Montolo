*Montolo* restriction type definitions and measures: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3343313.svg)](https://doi.org/10.5281/zenodo.3343313)

The current *MontoloStats* dataset: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3343053.svg)](https://doi.org/10.5281/zenodo.3343053)


# Montolo

To understand how current RDF-based ontologies are modeled we created **Montolo** which currently describes concepts related to *Restrictions* in ontologies.
Ontologies which are built with the RDF framework consist of concepts and relationship between these concepts. 
Additionally several restrictions in the form of axioms can be defined, using terms of the RDFS and OWL vocabulary.


[MontoloStats](https://lov.ilabt.imec.be/montolo/data/montolo-stats/latest/) is a dataset containing statistics about ontology modeling described using the [MontoloVoc](https://lov.ilabt.imec.be/montolo/ns/montolo-voc) vocabulary based on W3C PROV and W3C DataCube.
So far MontoloStats contains statistics from **98% of LOV** and **97% of BioPortal** ontologies.

This repository contains code to download ontologies, create the MontoloStats dataset and perform analyses.


# Creation of MontoloStats

## Download ontologies

**LOV**
First you have to download a current list of LOV ontologies
and then you can download all versions and filter for most recent versions.

```bash
# Get a list of ontologies listed in LOV
curl https://lov.linkeddata.es/dataset/lov/api/v2/vocabulary/list > lov_list.json

# Install needed nodejs modules
npm install 

# Download LOV ontologies
export NODE_OPTIONS=--max_old_space_size=4096
mkdir ontologies/2019-07-19_lov-all
node get-lov-ontologies.js lov_list.json ontologies/2019-07-19_lov-all

# Filter most current ontology version
mkdir ontologies/2019-07-19_lov-current
node get-latest-ontologies.js ontologies/2019-07-19_lov-all ontologies/2019-07-19_lov-current
```

**BioPortal**
First you have to download a current list of BioPortal ontologies
and then you can download all versions and filter for most recent verions.

```bash
todo: add script to repo

```


## Compute statistics

The statistics are computed using a [LODStats extension](https://github.com/IDLabResearch/lovstats) and are [semantically described](https://github.com/IDLabResearch/montolo-voc).

```
# Create stats for LOV
todo: add script to repo

# Create stats for BioPortal
todo: add script to repo

# Combine results in a single turtle file
# Create a single file from all made observations
cd analysis
python combine-results.py -i ../stats/lov_2019-07-16 -i ../stats/bioportal_2019-07-16 -o ../stats/MontoloStats.ttl -f 'turtle'
```

# Analysis of MontoloStats

The dataset is described using a W3C PROV and W3C DataCube-based vocabulary and thus can be analyzed using SPARQL queries.

```
# Optional:
# Create a csv file with all observations to further analyze the observations programatically, e.g. using R.
python create-observations-csv.py -i ../stats/MontoloStats.ttl -o montolo-observations.csv
```

The [montolo](montolo.ttl) file contains the descriptions of several restriction types, restriction type expressions and restriction type measures.
Statistical observations made based on [MontoloVoc](https://github.com/IDLabResearch/montolo-voc), 
should link to a corresponding `data structure definition` as defined by RDF Data Cube (see following listing).
We also provide several such data structures in the [montolo](montolo.ttl) file.

```turtle
@prefix lovc: <https://w3id.org/lovcube/ns/lovcube#> .
@prefix rls: <https://w3id.org/lovcube/ns/relovstats#> .

# Created statistics, described using the RDF Data Cube compliant LOVCube vocabulary
# The observation links to a corresponding RDF Data Cube dataset (described below)
[] a qb:Observation, prov:Entity, mov:RestrictionTypeStatistic ;
    mon:detectorDimension mon:maximumUnqualifiedCardinalityDetector ;
    mon:detectorVersionDimension mon:maximumUnqualifiedCardinalityLODStatsDetectorOwl-v1 ;
    mon:executionTimeDimension "2019-04-05T11:48:21.845150"^^xsd:dateTime ;
    mon:ontologyRepositoryDimension mon:lov ;
    mon:ontologyVersionDimension prov: ;
    mon:restrictionTypeDimension mon:maximumUnqualifiedCardinality ;
    mon:restrictionTypeOccurrence 1 ;
    qb:dataSet _:N740f60a3437f4b46869218f604ee20e4 ;
    prov:qualifiedGeneration _:Nd459003b47e54c04ae84a21707a1460b .

_:Nd92c84d33f9144549dd1fdfc1b98b620 a prov:Activity .

_:Nd459003b47e54c04ae84a21707a1460b a prov:Generation,
        prov:InstantaneousEvent ;
    prov:activity _:Nd92c84d33f9144549dd1fdfc1b98b620 ;
    prov:atTime "2019-04-05T11:48:21.845150"^^xsd:dateTime .

# A RDF Data Cube dataset which refers to a data structure definition, defined in this repository (montolo.ttl)
_:N740f60a3437f4b46869218f604ee20e4 a qb:DataSet,
        prov:Entity,
        mov:Dataset ;
    qb:structure mon:restrictionTypesAmount ;
    prov:qualifiedGeneration _:Nd459003b47e54c04ae84a21707a1460b ;
    prov:wasGeneratedBy _:Nd92c84d33f9144549dd1fdfc1b98b620 .

```

# How to use?

On https://w3id.org/montolo/data/montolo-stats (alternatively [here](https://zenodo.org/record/3343053) the existing *MontoloStats* dataset can be queried.
It was created based on 98% of [LOV](http://lov.linkeddata.es) and 97% [BioPortal](https://bioportal.bioontology.org) ontologies.

Example SPARQL query to get restriction types and correpsonding occurrence measure
```sparql
PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX mon: <https://w3id.org/montolo/ns/montolo#>

SELECT ((strafter(str(?type), "#")) as ?typeName) (SUM(?occurrence) as ?total) ?ontology
WHERE {
  ?obs a qb:Observation ;
    mon:restrictionTypeOccurrence ?occurrence ;
    mon:restrictionTypeDimension ?type ;
    mon:detectorVersionDimension ?detectorVersion ;
    mon:ontologyRepositoryDimension ?ontologyRepository ;
    mon:ontologyVersionDimension ?ontology .
}
GROUP BY ?type ?ontology
ORDER BY ?type ASC(?total) ?ontology

```
