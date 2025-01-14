<!-- eslint-disable vue/no-mutating-props -->
<template>
  <span>
      <div v-for="v in fields" :key="v.variable" class="field q-mb-md q-pb-lg q-pl-sm q-pr-sm" v-bind:class="colWidth(v.variable)">
        <div >
          <span v-if="v.schema.type=='table' || v.schema.type == 'array'">
            <q-field
              v-if="v.schema.items && v.schema.items.order && v.schema.items.order.length"
              :hint="tableHint(v)"
              class="q-pb-xl q-mb-xl"
              borderless
              bottom-slots
              :error="hasError(v.variable) || hasWarning(v.variable)"
            >
              <template v-slot:control>
                <AgSchema
                  v-model="data[v.variable]"
                  :schema="v.schema.items"
                  :editable="false"
                  :allow-examples="true"
                  :allow-force-save="true"
                  :ref="v.variable"
                  :table-warnings="getTableWarnings(v)"
                  :table-errors="getTableErrors(v)"
                  :admin="false"
                  :title="v.schema.title ? v.schema.title : v.variable"
                  />
              </template>
              <template v-slot:error>
                <div v-if="hasError(v.variable)">{{getError(v)}}</div>
                <div v-if="hasWarning(v.variable)" class="warning">Table contains warnings</div>
              </template>
            </q-field>
          </span>
          <span v-else v-bind:class="{'warning': warnings && warnings[v.variable]}">
            <p class="caption">{{v.schema.title ? v.schema.title : v.variable}}</p>
            <span><q-tooltip v-if="warnings && warnings[v.variable]">{{warnings ? getWarning(v) : ''}}</q-tooltip><q-icon v-if="warnings && warnings[v.variable]" size="14px" name="warning" color="orange"/> {{widget(v).formatValue(value[v.variable],'None')}}</span>
          </span>
        </div>
    </div>
  </span>

</template>

<script>
import widgetFactory from '../../widgets.js'
import AgSchema from '../aggrid/aggridDialog.vue'
// import _ from 'lodash'

export default {
  props: ['modelValue', 'schema', 'errors', 'warnings'],
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
    openTable (v) {
      this.$refs[v.variable][0].openSamplesheet()
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
    AgSchema // AgSchema: () => import('../agschema.vue')
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
