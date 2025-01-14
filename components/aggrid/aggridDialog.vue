<!-- eslint-disable no-case-declarations -->
<template>
  <div>
    <q-dialog v-model="opened" @show="onShow" :content-css="{height: '90vh', minWidth: '120vw', minHeight: '90vh'}" ref="modal" no-backdrop-dismiss no-esc-dismiss :maximized="maximized">
      <q-card style="min-width:90vw">
        <q-bar class="bg-primary text-white">
          <q-toolbar>
            <q-toolbar-title>{{title}}
              <span class="float-right">
                <q-btn title="Maximize" dense flat icon="crop_square"  @click="maximized=true" v-if="!maximized"/>
                <q-btn title="Minimize" dense flat icon="maximize" @click="maximized=false" v-if="maximized"/>
              </span></q-toolbar-title>
          </q-toolbar>
        </q-bar>
        <aggrid
              v-if="opened"
              :model-value="modelValue"
              :type="type"
              :schema="schema"
              :editable="editable"
              :allow-examples="allowExamples"
              :allow-force-save="allowForceSave"
              :table-warnings="tableWarnings"
              :tableErrors="tableErrors"
              :admin="admin"
              :validate-url="validateUrl"
              :on-save="save"
              :title="title"
              ref="grid"
              >
                <template v-slot:postButtons>
                  <!-- <q-btn
                    color="primary"
                    @click="show_help = true"
                    label="Help"
                    v-if="schema && schema.help"
                  /> -->
                  <q-btn
                    v-if="editable"
                    color="negative"
                    label="Dismiss"
                    @click="close"
                    class="float-right"
                  />
                  <q-btn
                    v-else
                    color="negative"
                    label="Close"
                    @click="close"
                    class="float-right"
                  />
              </template>
      </aggrid>
      </q-card>
    </q-dialog>
    <q-btn :label="table_button_label()" @click="openDialog"/>
  </div>
</template>

<script>
// import { QSelect } from 'quasar'
import aggrid from './aggrid.vue'

export default {
  name: 'AgSchema',
  props: ['modelValue', 'schema', 'editable', 'allowExamples', 'allowForceSave', 'tableWarnings', 'tableErrors', 'admin', 'validateUrl', 'title'],
  emits: ['update:modelValue', 'warnings', 'errors'],
  data () {
    return {
      opened: false,
      show_help: false,
      maximized: true
    }
  },
  mounted () {
    console.log('mounted dialog')
  },
  created () {
    console.log('created dialog')
  },
  unmounted () {
    console.log('destroyed dialog')
  },
  methods: {
    openDialog () {
      console.log('openDialog!!!', this.type, this.value)
      this.$refs.modal.show()
    },
    onShow () {
      console.log('onShow')
    },
    save (data) {
      this.$emit('update:modelValue', data)
      // this.$emit('input', this.getRowData(false))
      // this.$emit('update:modelValue', this.getRowData(false))
      // this.$emit('warnings', this.warnings)
      // this.$emit('errors', this.errors)
      this.close()
    },
    close () {
      this.$refs.modal.hide()
    },
    modalOpened () {
      console.log('modal opened')
    },
    table_button_label () {
      return (this.title ? this.title : this.variable) + ' (' + (this.modelValue ? this.modelValue.length : 0) + ')'
    },
    tableHint () {
      if (this.schema.description) {
        return this.schema.description
      } else {
        return (this.schema.title ? this.schema.title : '') + ': Click on the button above to open the table'
      }
    }
  },
  computed: {
    grid () {
      return this.$refs.grid
    }
  },
  components: {
    aggrid
  },
  watch: {
  }
}

</script>
