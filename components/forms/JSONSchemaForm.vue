<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="row">
    <!-- customFields: {{ fields }} -->
    <!-- schema: {{ schema }} -->
    <!-- Fields: {{ fields }} -->
    <!-- Data: {{ data }}
    Value: {{ value }}
    Errors: {{ errors }} -->
    <!-- <q-input v-model="data.foo"/> -->
      <!-- <q-editor ng-model="foo" v-if="false"/> -->
      <div v-for="v in fields" :key="v.variable" class="field q-mb-md q-pb-lg q-pl-sm q-pr-sm" v-bind:class="colWidth(v.variable)">
        <slot :name="`field_${v.variable}`" v-bind="{v, data, form:this }">
        <div>
          <!-- variable:{{ v.variable }}
          {{ widgetClass(v).component }} -->
          <!-- v-if="$store.getters.isStaff || !v.schema.internal" -->
          <fieldset v-if="v.schema.type=='object'">
            <legend>{{ v.schema.title ? v.schema.title : v.variable }}</legend>
            <JSONSchemaForm
                  v-model="data[v.variable]"
                  :schema="v.schema"
                  :editable="editable"
                  :modify="modify"
                  :warnings="getWarnings(v)"
                  :errors="getErrors(v)"
                  />
          </fieldset>
          <span v-else-if="v.schema.type=='table' || v.schema.type == 'array'">
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
                  :table-warnings="getWarnings(v)"
                  :table-errors="getErrors(v)"
                  :admin="true"
                  :title="v.schema.title"
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
        </slot>
    </div>
  </div>

</template>

<script>
import widgetFactory from '../../widgets.js'
import { QSelect, QOptionGroup, QCheckbox, QInput } from 'quasar'
import AgSchema from '../aggrid/aggridDialog.vue'
// import _ from 'lodash'

export default {
  props: ['modelValue', 'schema', 'editable', 'errors', 'warnings', 'modify', 'ui', 'hide'],
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
      // console.log('widgetClass', v, widget)
      return widgetFactory.getWidget(widget.type, v.schema.type, v.schema)
    },
    widget (v) {
      const options = v.schema.widget && v.schema.widget.options ? v.schema.widget.options : {}
      const WidgetClass = this.widgetClass(v)
      return new WidgetClass(v, options)
    },
    colWidth (variable) {
      if (this.schema.layout && this.schema.layout[variable] && this.schema.layout[variable].width) {
        return [this.schema.layout[variable].width]
      } else if (this.ui && this.ui[variable] && ['col-12', 'col-6', 'col-4', 'col-3'].indexOf(this.ui[variable].width) !== -1) {
        return [this.ui[variable].width]
      } else {
        return [this.default_width]
      }
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
    getWarnings (v) {
      return this.warnings && this.warnings[v.variable] ? this.warnings[v.variable] : {}
    },
    getErrors (v) {
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
      console.log('json schema fields', this.schema)
      if (!this.schema) {
        return []
      }
      if (this.schema.order || this.schema.properties) {
        let order = this.schema.order || Object.getOwnPropertyNames(this.schema.properties)
        order = order.filter(v => this.hidden.indexOf(v) === -1)
        return order.map(variable => {
          return { variable, schema: this.schema.properties[variable] }
        })
      }
      return []
    },
    value () {
      return this.modelValue
    },
    default_width () {
      if (this.ui && this.ui.defaults && ['col-12', 'col-6', 'col-4', 'col-3'].indexOf(this.ui.defaults.width) !== -1) {
        return this.ui.defaults.width
      } else {
        return 'col-12'
      }
    },
    hidden () {
      return this.hide || []
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
