# Montolo

Montoloi is a dataset containing statistics about ontology modeling described using a vocabulary based on W3C PROV and W3C DataCube.
So far Montolo contains statistics from **98% of LOV** and **97% of BioPortal** ontologies.

This repository contains code to download ontologies, create the Montolo dataset and perform analyses.


# Creation of Montolo

## Download ontologies

**LOV**
First you have to download a current list of LOV ontologies
and then you can download all versions and filter for most recent versions.

```
# Get a list of ontologies listed in LOV
curl https://lov.linkeddata.es/dataset/lov/api/v2/vocabulary/list > lov_list.json

# Download LOV ontologies
export NODE_OPTIONS=--max_old_space_size=4096
node get-lov-ontologies.js

# Filter most current ontology version
...
```

**BioPortal**
First you have to download a current list of BioPortal ontologies
and then you can download all versions and filter for most recent verions.


## Compute statistics

The statistics are computed using a [LODStats extension](https://github.com/IDLabResearch/lovstats) and are [semantically described](https://github.com/IDLabResearch/lovcube-voc).

```
# Create stats for LOV
...

# Create stats for BioPortal
...

# Combine results in a single turtle file
...
```

# Analysis of Montolo

The dataset is described using a W3C PROV and W3C DataCube-based vocabulary and thus can be analyzed using SPARQL queries.
Our advanced analysis uses the clean W3C DataCube structure and SPARQL to create a CSV file containing all observations for further processing in R.

```
# Create a single file from all made observations
cd analysis
python combine-results.py -i ../stats/lov_2019-07-16 -i ../stats/bioportal_2019-07-16 -o ../stats/montolo.ttl -f 'turtle'

# Create a csv file with all observations
python create-observations-csv.py -i ../stats/montolo.ttl -o montolo-observations.csv
```
