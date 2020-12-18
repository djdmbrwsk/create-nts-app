#!/usr/bin/env node

import yargs from 'yargs';

import Create from '../Commands/Create';

export interface CommonArgs {
  verbose: boolean;
}

yargs
  .option('verbose', {
    default: false,
    describe: 'Log detailed output for debugging',
    boolean: true,
  })
  .command(Create)
  .strict().argv;
