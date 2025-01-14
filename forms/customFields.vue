<!-- eslint-disable vue/no-mutating-props -->
<template>
  <span>
    <!-- Fields: {{ fields }} -->
    <!-- Data: {{ data }}
    Value: {{ value }}
    Errors: {{ errors }} -->
    <!-- <q-input v-model="data.foo"/> -->
      <!-- <q-editor ng-model="foo" v-if="false"/> -->
      <div v-for="v in fields" :key="v.variable" class="field q-mb-md q-pb-lg q-pl-sm q-pr-sm" v-bind:class="colWidth(v.variable)">
        <div >
          <!-- variable:{{ v.variable }}
          {{ widgetClass(v).component }} -->
          <!-- v-if="$store.getters.isStaff || !v.schema.internal" -->
          <span v-if="v.schema.type=='table' || v.schema.type == 'array'">
            <!-- :error="sample_data_error"
            bottom-slots :error-message="sample_data_error_label"
            :warning="sample_data_warning"
            warning-label="Samples contain warnings" -->
            <q-field
              v-if="v.schema.items && v.schema.items.order && v.schema.items.order.length"
              :hint="tableHint(v)"
              class="q-pb-xl q-mb-xl"
              borderless
              bottom-slots
              :error="hasError(v.variable) || hasWarning(v.variable)"
            >
              <!-- <Samplesheet v-model="submission.sample_data" :type="type"/> -->
              <template v-slot:control>
                <!-- :submission="submission"
                v-on:warnings="updateWarnings"
                v-on:errors="updateErrors" -->
                <!-- :editable="modify && ($store.getters.isStaff || !v.schema.internal)" -->
                <AgSchema
                  v-model="data[v.variable]"
                  :schema="v.schema.items"
                  :editable="modify"
                  :allow-examples="true"
                  :allow-force-save="true"
                  :ref="v.variable"
                  :table-warnings="getTableWarnings(v)"
                  :table-errors="getTableErrors(v)"
                  :admin="true"
                  :title="v.schema.title || v.variable"
                  />
                <!-- <q-btn :label="table_button_label(v)"  @click="openTable(v)" /> -->
              </template>
              <template v-slot:error>
                <div v-if="hasError(v.variable)">{{getError(v)}}</div>
                <div v-if="hasWarning(v.variable)" class="warning">Table contains warnings</div>
              </template>
            </q-field>
          </span>
          <span v-else-if="!modify" v-bind:class="{'warning': warnings && warnings[v.variable]}">
            <p class="caption">{{v.schema.title ? v.schema.title : v.variable}}</p>

            <span><q-tooltip v-if="warnings && warnings[v.variable]">{{warnings ? getWarning(v) : ''}}</q-tooltip><q-icon v-if="warnings && warnings[v.variable]" size="14px" name="warning" color="orange"/> {{widget(v).formatValue(value[v.variable],'None')}}</span>
          </span>
          <span v-else>
            <!-- {{ widgetClass(v).component }} -->
            <q-field
              v-if="['q-input', 'q-select', 'q-file'].indexOf(widgetClass(v).component) == -1"
              bottom-slots
              :error="hasError(v.variable) || hasWarning(v.variable)"
              :label="v.schema.title ? v.schema.title : v.variable"
              stack-label
              outlined
              orientation="vertical"
              :hint="v.schema.description"
              borderless
            >
              <component :is="widgetClass(v).component"
                :modelValue="data[v.variable] || widget(v).getDefault()"
                @update:model-value="val => {setValue('input', value, v.variable, val, $event)}"
                v-bind="widget(v).getOptions()"
              />

            <template v-slot:hint v-if="v.schema.description">
              {{v.schema.description}}
            </template>
            <template v-slot:error>
              <div v-if="hasError(v.variable)">{{getError(v)}}</div>
              <div v-if="hasWarning(v.variable)" class="warning">{{getWarning(v)}}</div>
            </template>
            </q-field>
            <component
              :is="widgetClass(v).component"
              :modelValue="data[v.variable] || widget(v).getDefault()"
              @update:model-value="val => {setValue('input', value, v.variable, val, $event)}"
              v-bind="widget(v).getOptions()"
              v-else
              bottom-slots
              :error="hasError(v.variable) || hasWarning(v.variable)"
              :label="v.schema.title ? v.schema.title : v.variable"
              stack-label
              outlined
              :hint="v.schema.description"
              map-options emit-value
            >
            <template v-slot:error>
              <div v-if="hasError(v.variable)">{{getError(v)}}</div>
              <div v-if="hasWarning(v.variable)" class="warning">{{getWarning(v)}}</div>
            </template>
          </component>
          </span>
        </div>
    </div>
  </span>

</template>

<script>
import widgetFactory from '../widgets.js'
import { QSelect, QOptionGroup, QCheckbox, QInput } from 'quasar'
import AgSchema from '../components/aggrid/aggridDialog.vue'
// import _ from 'lodash'

export default {
  props: ['modelValue', 'schema', 'editable', 'errors', 'warnings', 'modify'],
  data () {
    return {
      data: this.modelValue ? this.modelValue : {}
    }
  },
  setup (props) {
    console.log('setting up', props.schema, props)
  },
  mounted () {
    console.log('customFields Mounted', this.schema, this.modelValue)
  },
  methods: {
    widgetClass (v) {
      const widget = v.schema.widget ? v.schema.widget : {}
      console.log('widgetClass', v, widget)
      return widgetFactory.getWidget(widget.type, v.schema.type, v.schema)
    },
    widget (v) {
      const options = v.schema.widget && v.schema.widget.options ? v.schema.widget.options : {}
      const WidgetClass = this.widgetClass(v)
      return new WidgetClass(v, options)
    },
    colWidth (variable) {
      // if (!this.modify) {
      //   return 'col-4'
      // }
      return this.schema.layout[variable] && this.schema.layout[variable].width ? [this.schema.layout[variable].width] : ['col-12']
    },
    getError (v) {
      // console.log('getError1', v.schema, v.schema.error_message, this.errors, v.variable)
      let errors = v.schema.error_message ? v.schema.error_message : this.errors[v.variable]
      if (Array.isArray(errors)) {
        errors = errors.map(e => (typeof e === 'string' ? e : 'Table contains errors.'))
      }
      return errors && errors.join ? errors.join(', ') : errors
    },
    hasError (v) {
      return this.errors && this.errors[v] !== undefined
    },
    getWarning (v, flatten) {
      const warning = v.schema.error_message || this.warnings[v.variable]
      return warning && warning.join ? warning.join(', ') : ''
    },
    hasWarning (v) {
      return this.warnings && this.warnings[v] !== undefined
    },
    getTableWarnings (v) {
      return this.warnings && this.warnings[v.variable] ? this.warnings[v.variable] : {}
    },
    getTableErrors (v) {
      return this.errors && this.errors[v.variable] ? this.errors[v.variable] : {}
    },
    setValue (type, value, variable, val, e) {
      if (value.cancelBubble) {
        alert('cancel bubble')
        value.cancelBubble = true
      } else if (!value.target) {
        // console.log('set', this.value[variable], val)
        // this.value[variable] = val
        this.data[variable] = val
      }
      console.log('setValue', type, value, variable, val, e, this.value)
    },
    openTable (v) {
      console.log('refs', this.$refs, v, this.$refs[v.variable][0])
      this.$refs[v.variable][0].openSamplesheet()
    },
    table_button_label (v) {
      console.log('table_button_label', v, v.variable, this.value, this.value[v.variable])
      return (v.schema.title ? v.schema.title : v.variable) + ' (' + (this.value[v.variable] && this.value[v.variable].length ? this.value[v.variable].length : 0) + ')'
    },
    tableHint (v) {
      if (v.schema.items.description) {
        return v.schema.items.description
      } else {
        return (v.schema.title ? v.schema.title : v.variable) + ': Click on the button above to open the table'
      }
    }
  },
  computed: {
    fields () {
      if (!this.schema) {
        return []
      }
      const self = this
      if (self.schema.order) {
        return self.schema.order.map(function (variable) {
          return { variable, schema: self.schema.properties[variable] }
        })
      }
      return []
    },
    value () {
      return this.modelValue
    }
  },
  components: {
    QSelect,
    QOptionGroup,
    QCheckbox,
    QInput,
    AgSchema // AgSchema: () => import('../agschema.vue')
    // AgSchema: () => import('../agschema.vue')
  },
  watch: {
  }
}
</script>
<style scoped>
.q-field {
  padding: 3px !important;
}
.warning {
  color: orange;
}
p.caption {
  font-weight: bold;
}
</style>
