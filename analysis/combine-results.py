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
  parser.add_option('-i', '--input-dir', action='append', help='The input directory containing the RDF data cube statistics')
  parser.add_option('-o', '--output-dir', action='store', help='The output directory where the combined RDF file should be stored')
  parser.add_option('-f', '--output-format', action='store', help='The output format, possible values are "xml", "n3", "turtle", "nt", "pretty-xml", "trix", "trig" and "nquads"')
  (options, args) = parser.parse_args()
  if not options.input_dir or not options.output_dir \
    or options.output_format not in ('xml', 'n3', 'turtle', 'nt', 'pretty-xml', 'trix', 'trig', 'nquads'):
    parser.print_help();
    exit(1)

  g = Graph()

  all_found_stat_files = 0

  for d in options.input_dir:
    found_stat_files=0
    print("Analyzing directory '" + d + "'")

    for stats_file in os.listdir(d):
      if stats_file.endswith('ttl'):
        g.parse(os.path.join(d, stats_file), format='turtle')
        found_stat_files += 1
      if stats_file.endswith('nt'):
        g.parse(os.path.join(d, stats_file), format='nt')
        found_stat_files += 1
    all_found_stat_files += found_stat_files
    print(str(found_stat_files) + " stat files found for '" + d)

  print(str(all_found_stat_files) + " stat files found in total")
  g.serialize(destination=options.output_dir, format=options.output_format)

main()
