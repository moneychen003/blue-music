#!/usr/bin/env node
if (process.env.NODE_ENV == null) process.env.NODE_ENV = 'production'
// @ts-ignore
require('./server')
