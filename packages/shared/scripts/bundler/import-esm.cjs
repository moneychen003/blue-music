const dynamicImport = new Function('specifier', 'return import(specifier)')

exports.dynamicImport = dynamicImport
