import _ from 'lodash'
const Schema = {}
Schema.getVariablesOfType = function (schema, t) {
  if (!schema || !schema.order || !schema.properties) {
    return []
  }
  return schema.order.filter(v => schema.properties[v] && schema.properties[v].type === t)
}
Schema.getTables = function (schema) {
  return Schema.getVariablesOfType(schema, 'array')
}
Schema.getNonTables = function (schema) {
  if (!schema || !schema.order || !schema.properties) {
    return []
  }
  return schema.order.filter(v => schema.properties[v] && schema.properties[v].type !== 'array')
}
Schema.getTableSchema = function (schema, tableVariable) {
  return schema.properties[tableVariable].items
}
Schema.getTableSchemas = function (schema) {
  return Schema.getTables(schema).map(v => ({ table: v, schema: Schema.getTableSchema(schema, v) }))
}
// Take a coreomics style schema, and convert it to a standard jsonschema, replacing 'table' type with 'array' type where necessary
Schema.convertToJsonschema = function (coreomicsSchema) {
  const schema = _.cloneDeep(coreomicsSchema)
  schema['type'] = 'object'
  // Make changes to schema
  if ('properties' in schema) {
    Object.keys(schema.properties).forEach((k, i) => {
      if (schema.properties[k].type && schema.properties[k].type.toLowerCase() === 'table') {
        const listProp = {'type': 'array', 'items': schema['properties'][k]['schema']}
        delete schema['properties'][k]['schema']
        schema['properties'][k] = listProp
        schema['properties'][k]['items']['type'] = 'object'
      }
    })
  }
  return schema
}

export default Schema
