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
  parser.add_option('-i', '--input-file', action='store', help='The input file containing RDF triples')
  (options, args) = parser.parse_args()
  if not options.input_file:
    parser.print_help();
    exit(1)

  g = Graph()

  if options.input_file.endswith('nt'):
    g.parse(options.input_file, format='nt')
  elif options.input_file.endswith('ttl'):
    g.parse(options.input_file, format='turtle')


  query_amount_triples = """
SELECT (COUNT(*) as ?amountTriples)
WHERE {
  ?s ?p ?o .
}
"""

  query_amount_observations = """
PREFIX qb: <http://purl.org/linked-data/cube#>

SELECT (COUNT(*) as ?amountObservations)
WHERE {
  ?obs a qb:Observation .
}
"""

  print("Number of triples:")
  triple_amount = g.query(query_amount_triples)
  for t in triple_amount:
    print(t)

  print("Number of DataCube observations:")
  observations_amount = g.query(query_amount_observations)
  for o in observations_amount:
    print(o)

main()
