<!-- eslint-disable no-case-declarations -->
<template>
  <div class="ag-theme-balham">
    <!-- <p>exampleRows: {{ example }}</p> -->
  <!-- <p>editable: {{ editable }}</p> -->
  <!-- <p>modelValue: {{ modelValue }}</p> -->
  <slot>
  <q-card style="min-width:90vw">
    <q-toolbar v-if="title">
      <q-toolbar-title>{{ title }}</q-toolbar-title>
    </q-toolbar>
  <q-card-section style="height:80vh; min-height:80vh;">
    <q-btn
        color="primary"
        @click="show_help = true"
        label="Help"
        v-if="schema && schema.help && showButton('help')"
      ><q-tooltip ref="tooltip">Click "Help" for details about this table definition.</q-tooltip></q-btn> <!-- icon="fas fa-question-circle" -->
      <q-checkbox v-model="showDescriptions" label="Show descriptions" class="show_descriptions" v-if="agutil && agutil.hasDescriptions"/>
      <q-checkbox v-model="showExamples" label="Show examples" v-if="agutil && allowExamples && this.schema.examples && this.schema.examples.length"  class="show_examples"/>
      <q-btn-dropdown label="Resize Columns">
      <q-list>
        <q-item @click="agutil.sizeToFit()" clickable>
          <q-item-label>
            Fit all columns
          </q-item-label>
        </q-item>
        <q-item @click="agutil.autoSizeAll()" clickable>
          <q-item-label>
            Auto-size
          </q-item-label>
        </q-item>
      </q-list>
    </q-btn-dropdown>
    <slot name="grid">
              <ag-grid-vue style="width: 100%; height: 90%;" class="ag-theme-balham"
                rowSelection='multiple'
                :enableColResize='true'
                :enableSorting='true'
                :gridOptions='gridOptions'
                :rowData='rowData'
                :columnDefs='columnDefs'
                :pinnedTopRowData="getExampleRows"
                v-if="columnDefs.length > 0"
                @grid-ready="onGridReady"
                ref='grid'
                >
              </ag-grid-vue>
    </slot>
  </q-card-section>
    <q-card-actions>
    <slot name="preButtons"></slot>
    <slot name="buttons">
        <q-card-actions v-if="editable">
          <q-btn-dropdown split label="Add row" @click="agutil.addRow(1, defaultRow)" color="positive" v-if="showButton('add')">
            <q-list>
              <q-item clickable v-close-popup @click="agutil.addRow(1, defaultRow)">
                <q-item-label>
                  <q-item-section label>Add 1</q-item-section>
                </q-item-label>
              </q-item>
              <q-item clickable v-close-popup @click="agutil.addRow(10, defaultRow)">
                <q-item-label>
                  <q-item-section label>Add 10</q-item-section>
                </q-item-label>
              </q-item>
              <q-item clickable v-close-popup @click="agutil.addRow(25, defaultRow)">
                <q-item-label>
                  <q-item-section label>Add 25</q-item-section>
                </q-item-label>
              </q-item>
              <q-item clickable v-close-popup @click="agutil.addRow(100, defaultRow)">
                <q-item-label>
                  <q-item-section label>Add 100</q-item-section>
                </q-item-label>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            color="negative"
            label="Remove selected rows"
            @click="agutil.removeRows()"
            v-if="showButton('remove')"
          />
          <q-btn
            v-if="validateUrl && showButton('validate')"
            label="Validate"
            @click="validate(false)"
          />
          <q-btn
            color="negative"
            label="Discard"
            @click="discard"
            class="float-right"
            v-if="showButton('discard')"
          />
          <q-btn
            v-if="saveUrl && showButton('save')"
            color="positive"
            label="Save"
            @click="save()"
            class="float-right"
          />
          <q-btn
            v-if="!saveUrl && showButton('keep')"
            color="positive"
            label="Keep"
            @click="keep(validateUrl)"
            class="float-right"
          />
          <!-- <q-btn
            v-else
            color="positive"
            label="Save"
            @click="save()"
            class="float-right"
          /> -->

      </q-card-actions>
      <!-- <q-card-actions v-else>
        <q-btn
          color="negative"
          label="Close"
          @click="close"
          class="float-right"
          v-if="showButton('close')"
        />
      </q-card-actions> -->
      <!-- <q-btn label="add row" @click="agutil.addRow(5)"/>
      <q-btn label="remove rows" @click="agutil.removeRows()"/> -->
      <!-- <q-btn label="logData" @click="console.log(agutil.getRowData())"/>
      <q-btn label="getFlattenedProperties" @click="console.log(agutil.getFlattenedProperties())"/> -->
    </slot>
    <slot name="postButtons"></slot>
    </q-card-actions>
  </q-card>
  </slot>
  <q-dialog v-model="show_help">
      <q-card>
        <q-toolbar>
          Help
        </q-toolbar>

        <q-card-section>
          <div v-html="schema.help" v-if="schema && schema.help"></div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn
            color="primary"
            @click="show_help = false"
            label="Close"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css' // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-balham.css' // Optional theme CSS
// import 'ag-grid-community/styles/ag-theme-material.css'
import 'ag-grid-enterprise'
import _ from 'lodash'
import AgUtil from './agutil'
// import { ClipboardService } from '../../node_modules/ag-grid-enterprise/dist/lib/clipboardService.js'
// import axios from 'axios'
// var clipboardService = null

export default {
  name: 'AgSchema',
  props: ['modelValue', 'schema', 'editable', 'allowExamples', 'allowForceSave', 'tableWarnings', 'tableErrors', 'admin', 'validateUrl', 'saveUrl', 'onSave', 'title', 'defaultRow', 'buttons', 'hideButtons', 'options'],
  emits: ['update:modelValue', 'input', 'warnings', 'errors'],
  data () {
    return {
      opened: false,
      show_help: false,
      showExamples: this.allowExamples,
      showDescriptions: true,
      // schema: Object.freeze({}),
      rowData: [], // this.value,
      rootNode: {},
      columnDefs: [],
      exampleRows: [],
      gridOptions: {},
      errors: {},
      warnings: {},
      maximized: true
    }
  },
  mounted () {
    console.log('mounted agschema')
    this.setup()
  },
  created () {
    console.log('created agschema')
  },
  unmounted () {
    console.log('destroyed agschema')
  },
  methods: {
    setup () {
      this.agutil = new AgUtil(this.schema,
        {
          admin: this.admin,
          editable: this.editable,
          showExamples: this.allowExamples,
          showDescriptions: true,
          options: this.options
        },
        this)
      this.setupGrid()
    },
    setupData () {
      this.warnings = this.tableWarnings ? _.cloneDeep(this.agutil.getValidationObject(this.tableWarnings)) : {}
      this.errors = this.tableErrors ? _.cloneDeep(this.agutil.getValidationObject(this.tableErrors)) : {}
      if (this.value && this.value.length > 0) {
        this.rowData = _.cloneDeep(this.value)
      }
      // else {
      //   // this.agutil.addRow(10, this.defaultRow)
      //   // this.rowData = _.times(10, _.stubObject)
      // }
      this.agutil.updateErrors(this.errors, this.warnings)
    },
    discard () {
      this.setupData()
      this.$q.notify({ message: 'Changes have been discarded.', type: 'info' })
    },
    setupGrid () {
      this.setupData()
      this.gridOptions = this.agutil.getGridOptions()
      this.columnDefs = this.agutil.schema2Columns(this.schema)
    },
    onGridReady (params) {
      // alert('grid ready!')
      this.agutil.onGridReady(params)
      this.gridApi = params.api
      this.columnApi = params.columnApi
      this.rootNode = this.gridApi.getModel().rootNode
      this.exampleRows = this.agutil.getExampleRows()
      if (!this.rowData || this.rowData.length === 0) {
        this.agutil.addRow(10, this.defaultRow)
      }
      console.log('gridApi', this.gridApi)
    },
    updateModel (data) {
      // this.$emit('input', data)
      this.$emit('update:modelValue', data)
      this.$emit('warnings', this.warnings)
      this.$emit('errors', this.errors)
      if (this.onSave) {
        this.onSave(data)
      }
    },
    keep (validate) {
      if (validate) {
        this.validate(true)
      } else {
        this.updateModel(this.agutil.getRowData(false))
      }
    },
    save () {
      const data = this.agutil.getRowData(false)
      this.$axios.post(this.saveUrl, { schema: this.schema, data })
        .then(response => {
          // console.log(response)
          this.errors = {}
          this.warnings = {}
          this.agutil.updateErrors(this.errors, this.warnings)
          this.rowData = response.data
          this.gridOptions.api.redrawRows() // redrawCells({force: true})
          this.updateModel(data)
          this.$q.notify({ message: 'Changes have been saved.', type: 'positive' })
        })
        .catch(error => {
          // console.log('ERROR', error.response, self.$refs.grid, self.gridOptions.api.refreshCells)
          if (!error.response.data || (!error.response.data.errors && !error.response.data.warnings)) {
            this.$q.notify({ message: 'A server error occurred.', type: 'negative' })
            return
          }
          this.errors = error.response.data.errors
          this.warnings = error.response.data.warnings
          this.agutil.updateErrors(this.errors, this.warnings)
          this.gridOptions.api.redrawRows() // redrawCells({force: true})
          if (this.hasErrors) {
            this.$q.notify({ message: 'There were errors in your data.', type: 'negative' })
          }
          if (this.hasWarnings) {
            this.$q.notify({ message: 'There were warnings in your data.', type: 'warning' })
          }
          // else {
          //   const message = self.hasErrors ? 'There were errors.  Any errors will need to be corrected before completing submission.  You may choose to "save anyway" and then save this submission as a draft in order not to lose your work.' : 'There were warnings.  To ignore the warnings, click "save anyway".'
          //   self.$q.notify({
          //     message,
          //     timeout: 10000, // in milliseconds; 0 means no timeout
          //     type: self.hasErrors ? 'negative' : 'warning',
          //     // position: 'bottom', // 'top', 'left', 'bottom-left' etc.
          //     actions: [
          //       {
          //         label: 'Save Anyway',
          //         handler: () => {
          //           self.save()
          //         }
          //       }
          //     ]
          //   })
          // }
        })
    },
    validate (keep) {
      // this.hst.validateTable(true)
      console.log('validate', this.type, this.schema, keep)
      const self = this
      // this.$axios.post('/api/submission_types/' + this.type.id + '/validate_data/', {data: this.getRowData(true)})
      this.$axios.post(this.validateUrl, { schema: this.schema, data: this.agutil.getRowData(true) })
        .then(function (response) {
          // console.log(response)
          self.errors = {}
          self.warnings = {}
          self.agutil.updateErrors(self.errors, self.warnings)
          self.gridOptions.api.redrawRows() // redrawCells({force: true})
          self.$q.notify({ message: 'Successfully validated.  Please hit the SUBMIT button when ready to save your changes.', type: 'positive' })
          if (keep) {
            self.keep(false)
          }
        })
        .catch(function (error, stuff) {
          console.log('ERROR', error.response, self.$refs.grid, self.gridOptions.api.refreshCells)
          if (!error.response.data || (!error.response.data.errors && !error.response.data.warnings)) {
            self.$q.notify({ message: 'A server error occurred.', type: 'negative' })
            return
          }
          self.errors = error.response.data.errors
          self.warnings = error.response.data.warnings
          self.agutil.updateErrors(self.errors, self.warnings)
          self.gridOptions.api.redrawRows() // redrawCells({force: true})
          if (!keep || !self.allowForceSave) {
            if (self.hasErrors) {
              self.$q.notify({ message: 'There were errors in your data.', type: 'negative' })
            }
            if (self.hasWarnings) {
              self.$q.notify({ message: 'There were warnings in your data.', type: 'warning' })
            }
          } else {
            const message = self.hasErrors ? 'There were errors.  Any errors will need to be corrected before completing submission.  You may choose to "save anyway" and then save this submission as a draft in order not to lose your work.' : 'There were warnings.  To ignore the warnings, click "save anyway".'
            self.$q.notify({
              message,
              timeout: 10000, // in milliseconds; 0 means no timeout
              type: self.hasErrors ? 'negative' : 'warning',
              // position: 'bottom', // 'top', 'left', 'bottom-left' etc.
              actions: [
                {
                  label: 'Save Anyway',
                  handler: () => {
                    self.keep(false)
                  }
                }
              ]
            })
          }

          // if (error.response) {
          //   self.errors = error.response.data.errors
          // }
        })
    },
    showButton (buttonId) {
      if (this.hideButtons && this.buttons.indexOf(buttonId) !== -1) {
        return false
      }
      return !this.buttons || this.buttons.indexOf(buttonId) !== -1
    }
  },
  computed: {
    value () {
      return this.modelValue
    },
    // schema () {
    //   console.log('schema', this.schema)
    //   return this.schema ? this.schema : this.type.schema
    // },
    // columnDefs () {
    //   return this._columnDefs
    // },
    hasErrors () {
      // console.log('hasErrors', this.errors)
      return this.errors && _.size(this.errors) > 0
    },
    hasWarnings () {
      // console.log('hasWarnings', this.warnings)
      return this.warnings && _.size(this.warnings) > 0
    },
    // rowCount () {
    //   if (this.columnDefs.length > 0 && this.rootNode && this.rootNode.allChildrenCount) {
    //     return this.rootNode.allChildrenCount
    //   }
    //   return 0
    // },
    getExampleRows () {
      const examples = []
      if (this.showDescriptions && this.agutil.hasDescriptions()) {
        const descriptions = this.agutil.getColDescriptions()
        descriptions._row_type = 'description'
        examples.push(descriptions)
      }
      if (this.showExamples) {
        for (const i in this.schema.examples) {
          const example = this.schema.examples[i]
          example._row_type = 'example'
          examples.push(example)
        }
      }
      return examples
    },
    getTitle () {
      return this.title || this.schema.title
    },
    gridRef () {
      return this.$refs.grid
    }
  },
  components: {
    // QSelect,
    AgGridVue
  },
  watch: {
  }
}

</script>

<style>
  .ag-row .error {
    background-color: pink;
  }
  .ag-row .warning {
    background-color: #ffda85;
  }
  .ag-row .example, .show_examples span {
    background-color: lightgreen !important;
    color: black !important;
  }
  .ag-row .description, .show_descriptions span {
    background-color: lightgrey !important;
    white-space: normal;
    color: black !important;
  }
  .ag-theme-balham .ag-row-odd:not(.ag-row-selected) {
    background-color: #fafafa;
  }
  .ag-theme-balham .ag-cell {
    border-right: 1px solid #BDC3C7;
  }
  .ag-theme-balham .ag-ltr .ag-cell {
    border-right: 1px solid #BDC3C7;
  }
  .ag-row.read-only .ag-cell {
    background-color: #f8f8f8;
    color: #888;
  }
  /* .ag-watermark {
    display: none !important;
  } */
</style>
