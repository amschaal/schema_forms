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
export default Schema
