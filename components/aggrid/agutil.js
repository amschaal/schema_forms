import _ from 'lodash'
import sampleWidgetFactory from './widgets.js'
import NumericComponent from './editors/NumericComponent.vue'
// import DateComponent from './aggrid/DateComponent.vue'
// import AutocompleteComponent from './aggrid/editors/AutocompleteComponent.vue'
import BooleanComponent from './editors/BooleanComponent.vue'
import SelectComponent from './editors/SelectComponent.vue'
import GridComponent from './editors/GridComponent.vue'

class AgUtil {
  constructor (schema, props, component) {
    this.schema = schema
    this.props = props
    this.options = this.props.options || {}
    this.component = component
    this.errors = component.errors
    this.warnings = component.warnings
    this.descriptions = null
  }

  flatten (obj) {
    const flattened = {}
    for (const prop in obj) {
      if (obj[prop].type === 'object') {
        for (const prop2 in obj[prop]) {
          flattened[`${prop}.${prop2}`] = obj[prop][prop2]
        }
      } else {
        flattened[prop] = obj[prop]
      }
    }
    return flattened
  }

  flatten_errors (errors) {
    const flattened = {}
    for (const row in errors) {
      flattened[row] = this.flatten(errors[row])
    }
    return flattened
  }

  updateErrors (errors, warnings, flatten) {
    this.errors = {}
    if (flatten) {
      this.errors = this.flatten_errors(errors)
      this.warnings = this.flatten_errors(warnings)
    } else {
      this.errors = errors || {}
      this.warnings = warnings || {}
    }
  }

  onGridReady (params) {
    this.gridApi = params.api
    this.columnApi = params.columnApi
    this.rootNode = this.gridApi.getModel().rootNode
  }

  schema2Columns (schema) {
    console.log('schema2Columns', schema.properties)
    const columnDefs = []
    let col = null
    // var columnDefs = [{ headerName: '', lockPosition: true, valueGetter: this.rowIndex, cellClass: 'locked-col', width: 60, suppressNavigable: true, pinned: 'left' }]
    const order = schema.order || Object.keys(schema.properties).array
    order.forEach(prop => {
      if (schema.properties[prop].type === 'object') {
        // Supported nested properties
        const objschema = schema.properties[prop]
        const order = objschema.order || Object.keys(objschema.properties).array
        order.forEach(nestedProp => {
          if (this.props.editable || this.props.admin || !objschema.properties[nestedProp].internal) { // (!this.editable || this.$store.getters.isStaff || !schema.properties[prop].internal)
            col = this.getColDef(`${prop}.${nestedProp}`, objschema.properties[nestedProp], objschema)
            columnDefs.push(col)
          }
        })
      } else if (this.props.editable || this.props.admin || !schema.properties[prop].internal) { // (!this.editable || this.$store.getters.isStaff || !schema.properties[prop].internal)
        col = this.getColDef(prop, schema.properties[prop], schema)
        columnDefs.push(col)
      }
    })

    if (this.editable) {
      columnDefs[0].headerCheckboxSelection = true
      columnDefs[0].headerCheckboxSelectionFilteredOnly = true
      columnDefs[0].checkboxSelection = true
    }
    columnDefs.push({ field: '_row_type', hide: true })
    console.log('columnDefs', columnDefs)

    // this.parseDescriptions()

    return columnDefs
  }

  parseDescriptions (schema) {
    const properties = schema ? schema.properties : this.schema.properties
    const descriptions = {}
    for (const prop in properties) {
      if (properties[prop].type === 'object') {
        descriptions[prop] = this.parseDescriptions(properties[prop])
      } else {
        descriptions[prop] = properties[prop].description
      }
    }
    return descriptions
  }

  getColDescriptions (schema) {
    return this.parseDescriptions(schema)
  }

  rowIsEmpty (row) {
    return row['.new'] !== undefined || !_.values(row).some(x => x !== undefined && x !== '')
  }

  getRowData (filterAndSort) {
    const data = []
    const method = filterAndSort ? 'forEachNodeAfterFilterAndSort' : 'forEachNode'
    if (!this.gridApi) {
      return []
    }
    this.gridApi[method](function (node) {
      data.push(node.data)
    })
    const self = this, cleaned = []
    let take = false
    _.forEachRight(data, function (row) {
      if (take) {
        cleaned.unshift(row)
      } else if (!self.rowIsEmpty(row)) {
        take = true
        cleaned.unshift(row)
      }
    })
    // console.log('getRowData', data, cleaned)
    return cleaned
  }

  addRow (number, obj) {
    if (!obj) {
      obj = { data: {} }
      for (const k in this.schema.properties) {
        if (typeof this.schema.properties[k].type === 'object') {
          obj[k] = {}
        }
      }
    }
    obj['.new'] = true
    const rows = []
    for (let i = 0; i < number; i++) {
      rows.push(_.cloneDeep(obj))
    }
    this.gridApi.applyTransaction({ add: rows })
    // console.log('addRow', this.getRowData())
  }

  removeRows () {
    const selectedData = this.gridApi.getSelectedRows()
    this.gridApi.applyTransaction({ remove: selectedData })
    // this.errors = {}
    this.gridApi.redrawRows()
    // this.validate(false)
  }

  sizeToFit () {
    this.gridApi.sizeColumnsToFit()
  }

  autoSizeAll () {
    const allColIds = this.columnApi.getAllColumns().map(column => column.colId)
    this.columnApi.autoSizeColumns(allColIds)
  }

  getNestedData (row, field) {
    if (!row) {
      return null
    }
    let data = row
    field.split('.').forEach(v => {
      if (data) {
        data = data[v]
      }
    })
    return data
  }

  getCellErrors (row, field) {
    const props = this.getFlattenedProperties()
    // console.log('getCellErrors', row, field, this)
    const fieldError = this.getNestedData(this.errors[row], field)
    if (this.errors[row] && fieldError) {
      if (props[field].error_message) {
        return [props[field].error_message]
      } else {
        return fieldError
      }
    } else {
      return null
    }
  }

  getCellWarnings (row, field) {
    // console.log('getCellWarnings', row, field, this)
    const fieldWarning = this.getNestedData(this.warnings[row], field)
    if (this.errors[row] && fieldWarning) {
      return fieldWarning
    } else {
      return null
    }
  }

  getColDef (id, definition, schema) {
    // alert('getColDef ' + id)
    // console.log('getColDef', definition, schema)
    // const self = this
    const editable = definition.readOnly ? false : this.cellEditable.bind(this)
    const aggrid = definition['x-aggrid'] || {}
    const cellRenderer = aggrid.cellRenderer
    const cellRendererParams = aggrid.cellRendererParams
    const cellRendererSelector = params => {
      if (params.node.rowPinned) {
        return {
          component: params => params.value,
          params: cellRendererParams
        }
      } else if (cellRenderer) {
        return {
          component: cellRenderer,
          params: cellRendererParams
        }
      }
    }
    const cellClass = params => {
      // console.log('cellClass', params, this.errors)
      if (params.node.rowPinned) {
        if (params.data._row_type === 'description') {
          return ['description']
        } else {
          return ['example']
        }
      } else if (this.errors[params.rowIndex] && this.getNestedData(this.errors[params.rowIndex], params.colDef.field)) {
        return ['error']
      } else if (this.warnings[params.rowIndex] && this.warnings[params.rowIndex][params.colDef.field]) {
        return ['warning']
      }
      return []
    }
    let header = id
    if (definition.title) {
      header = definition.title
    }
    if (schema.required && schema.required.indexOf(id) !== -1) {
      header = '*' + header
    }
    const cellTooltip = params => {
      // console.log('cellTooltip', params)
      if (params.data._row_type === 'description' || params.data._row_type === 'example') {
        return 'Descriptions and examples cannot be modified.  Please use blank rows for user data.' // params.value
      }
      const errors = this.getCellErrors(params.rowIndex, params.colDef.field)
      const warnings = this.getCellWarnings(params.rowIndex, params.colDef.field)
      const text = `row ${params.rowIndex + 1}, ${header}`
      if (errors) {
        return text + ': ' + errors.join(', ')
      } else if (warnings) {
        return text + ': ' + warnings.join(', ')
      }
      return params.value ? text + ': ' + params.value : text
    }
    // console.log('definition', id, definition, schema)
    // var header = id
    let tooltip = null
    // if (definition.title) {
    //   header = definition.title
    // }
    // if (schema.required && schema.required.indexOf(id) !== -1) {
    //   header = '*' + header
    // }
    if (definition.description) {
      tooltip = definition.description
    }
    let WidgetClass = null
    if (definition.widget && definition.widget.type) {
      // console.log('getcolwidget', definition.widget, definition.widget.type)
      WidgetClass = sampleWidgetFactory.getWidget(definition.widget.type)
    }
    // console.log('widget', definition, WidgetClass)
    // console.log('factory', sampleWidgetFactory)
    let options = null, def = null
    if (WidgetClass) {
      // console.log('WidgetClass', definition.widget.options)
      options = definition.widget.options
      // options._schema = JSON.parse(JSON.stringify(schema))
      // Object.freeze(options)
      const widget = new WidgetClass(id, options)
      return { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, headerTooltip: tooltip, field: id, cellEditor: WidgetClass.component, cellEditorParams: { definition, widget_options: widget.getOptions() }, cellClass, tooltipValueGetter: cellTooltip, pinned: definition.pinned } // values: definition.enum, widget: definition.widget,
    }
    switch (definition.type) {
      case 'table':
        // console.log('object', definition)
        // var _options = JSON.parse(JSON.stringify(definition.widget.options))
        // const _options = { _schema: JSON.parse(JSON.stringify(definition.schema)) }
        Object.freeze(options)
        // var widget = new WidgetClass(id, options)
        return { editable, headerName: header, headerTooltip: tooltip, field: id, cellEditor: GridComponent, cellEditorParams: { definition, widget_options: { _schema: JSON.parse(JSON.stringify(definition.schema)) } }, cellClass, tooltipValueGetter: cellTooltip, pinned: definition.pinned }
      case 'string':
        if (definition.enum) {
          // console.log('enum', {headerName: header, headerTooltip: tooltip, field: id, cellEditor: SelectComponent, cellEditorParams: {definition: definition, widget_options: {multiple: definition.multiple}}, cellClass: cellClass, tooltip: cellTooltip, pinned: definition.pinned})
          // return {headerName: header, headerTooltip: tooltip, field: id, cellEditor: AutocompleteComponent, cellEditorParams: {values: definition.enum, widget: definition.widget, definition: definition}, cellClass: cellClass, tooltip: cellTooltip, pinned: definition.pinned} // cellEditor: 'agRichSelectCellEditor', cellEditorParams: {values: definition.enum}
          // return {headerName: header, headerTooltip: tooltip, field: id, cellEditor: 'agRichSelectCellEditor', cellEditorParams: {values: definition.enum}, cellClass: cellClass, tooltip: cellTooltip, pinned: definition.pinned} // cellEditor: 'agRichSelectCellEditor', cellEditorParams: {values: definition.enum} // cellEditor: AutocompleteComponent
          return { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, headerTooltip: tooltip, field: id, cellEditor: SelectComponent, cellEditorParams: { definition, widget_options: { multiple: definition.multiple } }, cellClass, tooltipValueGetter: cellTooltip, pinned: definition.pinned }
        } else {
          return { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, headerTooltip: tooltip, field: id, cellDataType: 'text', cellClass, tooltipValueGetter: cellTooltip, pinned: definition.pinned }
        }
      case 'number':
        return { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, headerTooltip: tooltip, field: id, cellEditor: NumericComponent, cellClass, tooltipValueGetter: cellTooltip, cellDataType: 'number', pinned: definition.pinned }
      case 'boolean':
        return { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, headerTooltip: tooltip, field: id, cellEditor: BooleanComponent, cellClass, tooltipValueGetter: cellTooltip, cellDataType: 'boolean', pinned: definition.pinned }
        // return { test: 'foo', headerName: header, headerTooltip: tooltip, field: id, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer', cellClass, tooltipValueGetter: cellTooltip, cellDataType: 'boolean', pinned: definition.pinned }
      case 'array':
        def = { editable, cellRendererSelector, cellRenderer, cellRendererParams, headerName: header, field: id, cellClass, tooltipValueGetter: cellTooltip, pinned: definition.pinned }
        if (definition.items && definition.items.enum) {
          def.source = definition.items.enum
        }
        return def
      default:
        // console.log(id,definition);
        throw new Error('Unsupported type ' + definition.type)
    }
  }

  getFlattenedProperties () {
    const properties = {}
    for (const prop in this.schema.properties) {
      if (this.schema.properties[prop].type === 'object') {
        for (const prop2 in this.schema.properties[prop].properties) {
          properties[`${prop}.${prop2}`] = this.schema.properties[prop].properties[prop2]
        }
      } else {
        properties[prop] = this.schema.properties[prop]
      }
    }
    return properties
  }

  hasDescriptions () {
    const descriptions = this.getColDescriptions()
    return descriptions !== null
  }

  getExampleRows () {
    const examples = []
    if (this.props.showDescriptions && this.hasDescriptions()) {
      const descriptions = this.getColDescriptions(this.schema)
      descriptions._row_type = 'description'
      examples.push(descriptions)
    }
    if (this.props.showExamples) {
      for (const i in this.schema.examples) {
        const example = this.schema.examples[i]
        example._row_type = 'example'
        examples.push(example)
      }
      // examples = examples.concat(this.schema.examples)
    }
    // console.log('examples', examples)
    return examples
  }

  cellEditable (params) {
    // console.log('cellEditable', this.editable, params)
    if (params.node.rowPinned === 'top') {
      this.component.$q.notify({ position: 'top', message: 'Description and example rows are not editable.  Please use the "Add row" button for editable rows.' })
      return false
    }
    if (this.options.isCellEditable) {
      return this.props.editable && this.options.isCellEditable(params.node)
    }
    return this.props.editable
  }

  expandDescriptionRow (params) {
    // console.log('expandDescriptionRow', params, params.api, params.api.getPinnedTopRow(0)) //
    if (params.api.getPinnedTopRow(0)) {
      params.api.getPinnedTopRow(0).isDescription = true
    }
    params.api.onRowHeightChanged()
  }

  onCellFocused (params) {
    // console.log('onCellFocused', this, this.getCellErrors)
    if (this.dismiss) {
      this.dismiss()
    }
    if (params.column) {
      const errors = this.getCellErrors(params.rowIndex, params.column.colDef.field)
      if (errors) {
        this.dismiss = this.component.$q.notify({ position: 'top', message: `Error at Row ${params.rowIndex + 1}, Column "${params.column.colDef.headerName}": ` + errors.join(', ') })
      } else {
        const warnings = this.getCellWarnings(params.rowIndex, params.column.colDef.field)
        if (warnings) {
          this.dismiss = this.component.$q.notify({ position: 'top', color: 'warning', message: `Warning at Row ${params.rowIndex + 1}, Column "${params.column.colDef.headerName}": ` + warnings.join(', ') })
        }
      }
    }
  }

  getValidationObject (validation) {
    // validation errors or warnings could be a list mixed strings and objects, we only want the object
    if (typeof validation === 'object' && !Array.isArray(validation)) {
      return validation
    } else if (Array.isArray(validation)) {
      for (const i in validation) {
        if (typeof validation[i] === 'object' && !Array.isArray(validation[i])) {
          return validation[i]
        }
      }
    }
    return {}
  }

  getGridOptions () {
    const gridOptions = {
      enableRangeSelection: true,
      defaultColDef: {
        editable: this.cellEditable.bind(this),
        // suppressSorting: true, // deprecated
        sortable: false, // newer version
        suppressMenu: true // let's keep it simple
      },
      getRowStyle: function (params) {
        if (params.node.rowPinned) {
          return { 'font-weight': 'bold' }
        }
      },
      getRowHeight: function (params) {
        // console.log('getRowHeight', params, params.node.rowPinned, params.data)
        if (params.node.rowPinned === 'top' && params.data && params.data._row_type === 'description') {
          return 75
        } else {
          return 25
        }
      },
      onPinnedRowDataChanged: this.expandDescriptionRow.bind(this),
      onCellFocused: this.onCellFocused.bind(this),
      onCellValueChanged (event) {
        console.log('onCellValueChanged', event)
        const row = event.node.data
        if (row['.new'] !== undefined) {
          delete row['.new']
        }
      },
      // suppressMultiRangeSelection: true,
      // suppressRowClickSelection: true,
      // checkboxSelection: function () { return true },
      processCellFromClipboard (params) {
        switch (params.column.colDef.cellDataType) {
          case 'boolean':
            if (params.value === 'true' || params.value === 'True' || params.value === true) {
              return true
            }
            return false
          case 'numeric':
            return parseFloat(params.value)
          default:
            return params.value
        }
      },
      rowGroupPanelSuppressSort: true,
      rowSelection: 'multiple'
    }
    // gridOptions.getRowClass = this.options.getRowClass
    return _.merge(gridOptions, this.options)
  }
}
export default AgUtil
