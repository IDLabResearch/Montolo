from rdflib import Graph
import csv
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
from pprint import pprint
from optparse import OptionParser
import os


def main():

  parser = OptionParser(usage="usage: %prog [options]")
  parser.add_option('-i', '--input-file', action='store', help='The input file containing the RDF data cube statistics')
  parser.add_option('-o', '--output-file', action='store', help='The CSV output file')
  (options, args) = parser.parse_args()
  if not options.input_file or not options.output_file:
    parser.print_help();
    exit(1)

  g = Graph()
  if options.input_file.endswith('ttl'):
    g.parse(options.input_file, format='turtle')
  if options.input_file.endswith('nt'):
    g.parse(options.input_file, format='nt')

  observations_query = """
PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX mon: <https://w3id.org/lovcube/ns/relovstats#>

SELECT ?ontologyRepository ?ontology ?type ?detector ?detectorVersion ?occurrence ?executionTime
WHERE {
  ?obs a qb:Observation ;
    mon:restrictionTypeOccurrence ?occurrence ;
    mon:restrictionTypeDimension ?type ;
    mon:detectorDimension ?detector ;
    mon:detectorVersionDimension ?detectorVersion ;
    mon:ontologyVersionDimension ?ontology ;
    mon:ontologyRepositoryDimension ?ontologyRepository ;
    mon:executionTimeDimension ?executionTime .
}
  """

  observations = g.query(observations_query)
  write_csv(options.output_file, observations, ['ontologyRepository', 'ontology', 'type', 'detector', 'detectorVersion', 'occurrence', 'executionTime'])

def write_csv(output_filename, data, header):

  with open(output_filename, 'w') as csv_file:
    csv_writer = csv.writer(csv_file, delimiter=',')
    csv_writer.writerow(header)
    for row in data:
      csv_writer.writerow(row)

main()
