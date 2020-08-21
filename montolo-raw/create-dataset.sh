#!/bin/bash

YARRRML_PARSER="./yarrrml-parser/bin/parser.js"
RML_MAPPER="rmlmapper-4.8.1.jar"

if [ ! -f $YARRRML_PARSER ];
then
  echo "yarrrml parser not found at '$YARRRML_PARSER'"
  exit 1
elif [ ! -f $RML_MAPPER ]
then
  echo "rml mapper not found at '$RML_MAPPER'"
  exit 1
fi

if [ "$#" -ne 2 ];
then
  echo "use 'bash create-dataset.sh my-mapping.yml my-output.ttl"
  exit 1
fi

yarrrml_file=$1
output_file=$2
rml_file=`basename $yarrrml_file .yml`"-rml.ttl"
tmp_file=`basename $output_file .ttl`"-tmp"


if [ ! -f $yarrrml_file ];
then
  echo "No YARRRML file named '$yarrrml_file' found!"
  exit 1
fi


echo "Generate RML ..."
node $YARRRML_PARSER -i $yarrrml_file -o $rml_file


if [ $? -eq 0 ]
then
  echo "Execute RML mapping ..."
  echo "time java -jar $RML_MAPPER -m $rml_file -s turtle > $output_file"
  time java -jar $RML_MAPPER -m $rml_file -s turtle > $output_file
  if [ $? -eq 0 ]
  then
    echo "Data created at '$output_file'"

    echo "replacing URI encoding for Astrea identifiers (%3A to ':')"
    sed 's/%3A/:/g' $output_file > $tmp_file
    mv $tmp_file $output_file
    comunica-sparql-file $output_file "SELECT (COUNT(?s) as ?c) WHERE { ?s ?p ?o . }"
    if [ $? -eq 0 ]
    then
      exit 0
    else
      echo "Invalid RDF"
      exit 3
    fi
  else
    echo "Could not map data"
    exit 2
  fi
else
  echo "Could not generate RML"
  exit 1
fi
